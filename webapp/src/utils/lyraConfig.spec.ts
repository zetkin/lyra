import mock from 'mock-fs';
import { afterEach, describe, expect, it } from '@jest/globals';
import { LyraConfig, MessageKind, ServerConfig } from './lyraConfig';
import {
  LyraConfigReadingError,
  ProjectNameNotFoundError,
  ProjectPathNotFoundError,
  ServerConfigReadingError,
} from '@/errors';

describe('config.ts', () => {
  afterEach(() => {
    mock.restore();
  });

  describe('LyraConfig', () => {
    describe('readFromDir()', () => {
      it('reads message kind and path from lyra.yml', async () => {
        mock({
          '/path/to/repo/lyra.yml': [
            'projects:',
            '- path: .',
            '  messages:',
            '    format: yaml',
            '    path: locale',
            '  translations:',
            '    path: locale',
          ].join('\n'),
        });
        const config = await LyraConfig.readFromDir('/path/to/repo');
        expect(config.projects[0].messageKind).toEqual(MessageKind.YAML);
        expect(config.projects[0].messagesPath).toEqual('/path/to/repo/locale');
        expect(config.projects[0].translationsPath).toEqual(
          '/path/to/repo/locale',
        );
        expect(config.baseBranch).toEqual('main'); // default value
      });

      it('combines project path with messages path', async () => {
        mock({
          '/path/to/repo/lyra.yml': [
            'projects:',
            '- path: project',
            '  messages:',
            '    format: yaml',
            '    path: locale',
            '  translations:',
            '    path: locale',
          ].join('\n'),
        });

        const config = await LyraConfig.readFromDir('/path/to/repo');
        expect(config.projects[0].messagesPath).toEqual(
          '/path/to/repo/project/locale',
        );
        expect(config.projects[0].translationsPath).toEqual(
          '/path/to/repo/project/locale',
        );
      });

      it('reads baseBranch', async () => {
        mock({
          '/path/to/repo/lyra.yml': [
            'baseBranch: branch1',
            'projects:',
            '- path: project',
            '  messages:',
            '    format: ts',
            '    path: anyValue',
            '  translations:',
            '    path: anyValue',
          ].join('\n'),
        });

        const config = await LyraConfig.readFromDir('/path/to/repo');
        expect(config.baseBranch).toEqual('branch1');
      });

      it('reads more than one projects', async () => {
        mock({
          '/path/to/repo/lyra.yml': [
            'projects:',
            '- path: project1',
            '  messages:',
            '    format: yaml',
            '    path: locale1',
            '  translations:',
            '    path: locale1',
            '- path: project2',
            '  messages:',
            '    format: ts',
            '    path: msg_locale2',
            '  translations:',
            '    path: trans_locale2',
          ].join('\n'),
        });

        const config = await LyraConfig.readFromDir('/path/to/repo');
        expect(config.projects.length).toEqual(2);

        expect(config.projects[0].path).toEqual('project1');
        expect(config.projects[0].messagesPath).toEqual(
          '/path/to/repo/project1/locale1',
        );
        expect(config.projects[0].translationsPath).toEqual(
          '/path/to/repo/project1/locale1',
        );
        expect(config.projects[0].messageKind).toEqual(MessageKind.YAML);

        expect(config.projects[1].path).toEqual('project2');
        expect(config.projects[1].messagesPath).toEqual(
          '/path/to/repo/project2/msg_locale2',
        );
        expect(config.projects[1].translationsPath).toEqual(
          '/path/to/repo/project2/trans_locale2',
        );
        expect(config.projects[1].messageKind).toEqual(MessageKind.TS);
      });

      describe('throw LyraConfigReadingError for invalid content or file not found', () => {
        it('throws for empty file', async () => {
          expect.assertions(1);
          mock({ '/path/to/repo/lyra.yml': '' });

          const promise = () => LyraConfig.readFromDir('/path/to/repo');
          await expect(promise).rejects.toThrow(LyraConfigReadingError);
        });

        it('throws for missing messages path', async () => {
          expect.assertions(1);
          mock({
            '/path/to/repo/lyra.yml': [
              'baseBranch: branch1',
              'projects:',
              '- path: project',
              '  messages:',
              '    format: ts',
              '  translations:',
              '    path: anyValue',
            ].join('\n'),
          });
          const promise = () => LyraConfig.readFromDir('/path/to/repo');
          await expect(promise).rejects.toThrow(LyraConfigReadingError);
        });

        it('throws for file not found', async () => {
          expect.assertions(1);
          mock({
            '/path/to/repo/xxx.yml': [
              'baseBranch: branch1',
              'projects:',
              '- path: project',
              '  messages:',
              '    format: ts',
              '    path: anyValue',
              '  translations:',
              '    path: anyValue',
            ].join('\n'),
          });
          const promise = () => LyraConfig.readFromDir('/path/to/repo');
          await expect(promise).rejects.toThrow(LyraConfigReadingError);
        });
      });
    });
    describe('getProjectConfigByPath()', () => {
      it('reads message kind and path from lyra.yml', async () => {
        mock({
          '/path/to/repo/lyra.yml': [
            'projects:',
            '- path: foo',
            '  messages:',
            '    format: yaml',
            '    path: locale',
            '  translations:',
            '    path: locale',
          ].join('\n'),
        });
        const config = await LyraConfig.readFromDir('/path/to/repo');
        const projectConfig = config.getProjectConfigByPath('foo');
        expect(projectConfig.messageKind).toEqual(MessageKind.YAML);
        expect(projectConfig.messagesPath).toEqual('/path/to/repo/foo/locale');
        expect(projectConfig.translationsPath).toEqual(
          '/path/to/repo/foo/locale',
        );
        expect(config.baseBranch).toEqual('main'); // default value
      });

      describe('throw ProjectPathNotFoundError for invalid project path', () => {
        it('throws for wrong path', async () => {
          expect.assertions(1);
          mock({
            '/path/to/repo/lyra.yml': [
              'baseBranch: branch1',
              'projects:',
              '- path: project',
              '  messages:',
              '    format: yaml',
              '    path: locale',
              '  translations:',
              '    path: anyValue',
            ].join('\n'),
          });
          const config = await LyraConfig.readFromDir('/path/to/repo');
          const actual = () => config.getProjectConfigByPath('wrongPath');
          expect(actual).toThrow(ProjectPathNotFoundError);
        });
      });
    });
  });
  describe('ServerConfig', () => {
    describe('read()', () => {
      it('reads project property from server config projects', async () => {
        mock({
          '../config/projects.yaml': [
            'projects:',
            '  - name: foo',
            '    repo_path: /path/to/repo',
            '    project_path: ./project',
            '    host: github.com',
            '    owner: owner',
            '    repo: app.zetkin.org',
            '    github_token: github_123245',
          ].join('\n'),
        });
        const config = await ServerConfig.read();
        expect(config.projects[0].name).toEqual('foo');
        expect(config.projects[0].repoPath).toEqual('/path/to/repo');
        expect(config.projects[0].projectPath).toEqual('./project');
        expect(config.projects[0].host).toEqual('github.com');
        expect(config.projects[0].owner).toEqual('owner');
        expect(config.projects[0].repo).toEqual('app.zetkin.org');
        expect(config.projects[0].githubToken).toEqual('github_123245');
      });
      it('reads multi project', async () => {
        mock({
          '../config/projects.yaml': [
            'projects:',
            '  - name: foo',
            '    repo_path: /path/to/repo',
            '    project_path: ./project1',
            '    host: github.com',
            '    owner: owner',
            '    repo: app.zetkin.org',
            '    github_token: github_123245',
            '  - name: bar',
            '    repo_path: /path/to/repo',
            '    project_path: ./project2',
            '    host: github.com',
            '    owner: owner',
            '    repo: app.zetkin.org',
            '    github_token: github_123245',
          ].join('\n'),
        });
        const config = await ServerConfig.read();
        expect(config.projects.length).toEqual(2);
        expect(config.projects[0].name).toEqual('foo');
        expect(config.projects[0].projectPath).toEqual('./project1');
        expect(config.projects[1].name).toEqual('bar');
        expect(config.projects[1].projectPath).toEqual('./project2');
      });
      it('throws for empty projects file', async () => {
        expect.assertions(1);
        mock({
          '../config/projects.yaml': '',
        });
        const actual = () => ServerConfig.read();
        await expect(actual).rejects.toThrow();
      });
      it('throws for missing projects file', async () => {
        expect.assertions(1);
        mock({
          './config/WrongFile.yaml': [
            'projects:',
            '  - name: foo',
            '    repo_path: /path/to/repo',
            '    project_path: ./project',
            '    host: github.com',
            '    owner: owner',
            '    repo: app.zetkin.org',
            '    github_token: github_123245',
          ].join('\n'),
        });
        const actual = () => ServerConfig.read();
        await expect(actual).rejects.toThrow(ServerConfigReadingError);
      });
    });
    describe('getProjectConfigByName()', () => {
      it('reads config of project by name', async () => {
        mock({
          '../config/projects.yaml': [
            'projects:',
            '  - name: foo',
            '    repo_path: /path/to/repo',
            '    project_path: ./project1',
            '    host: github.com',
            '    owner: owner',
            '    repo: app.zetkin.org',
            '    github_token: github_123245',
            '  - name: bar',
            '    repo_path: /path/to/repo',
            '    project_path: ./project2',
            '    host: github.com',
            '    owner: owner',
            '    repo: app.zetkin.org',
            '    github_token: github_123245',
          ].join('\n'),
        });
        const projectConfig = await ServerConfig.getProjectConfig('bar');
        expect(projectConfig.repoPath).toEqual('/path/to/repo');
        expect(projectConfig.projectPath).toEqual('./project2');
      });

      it('throw ProjectNameNotFoundError for invalid project path', async () => {
        expect.assertions(1);
        mock({
          '../config/projects.yaml': [
            'projects:',
            '  - name: foo',
            '    repo_path: /path/to/repo',
            '    project_path: ./project1',
            '    host: github.com',
            '    owner: owner',
            '    repo: app.zetkin.org',
            '    github_token: github_123245',
          ].join('\n'),
        });
        const config = await ServerConfig.read();
        const actual = () => config.getProjectConfig('wrong_name');
        expect(actual).toThrow(ProjectNameNotFoundError);
      });
    });
  });
});
