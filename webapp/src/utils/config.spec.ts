import mock from 'mock-fs';
import { describe, expect, it } from '@jest/globals';
import { LyraConfig, MessageKind, ServerConfig } from './config';
import {
  LyraConfigReadingError,
  ProjectNameNotFoundError,
  ProjectPathNotFoundError,
  ServerConfigReadingError,
} from '@/errors';

describe('config.ts', () => {
  describe('LyraConfig', () => {
    describe('get()', () => {
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
        const config = await LyraConfig.get('/path/to/repo', false);
        const projectArr = Array.from(config.projects.values());
        expect(projectArr[0].messageKind).toEqual(MessageKind.YAML);
        expect(projectArr[0].messagesPath).toEqual('/path/to/repo/locale');
        expect(projectArr[0].translationsPath).toEqual('/path/to/repo/locale');
        expect(config.baseBranch).toEqual('main'); // default value
      });

      it('combines project path with messages path', async () => {
        mock({
          '/path/to/repo/lyra.yml': [
            'projects:',
            '- path: subproject',
            '  messages:',
            '    format: yaml',
            '    path: locale',
            '  translations:',
            '    path: locale',
          ].join('\n'),
        });

        const config = await LyraConfig.get('/path/to/repo', false);
        const projectArr = Array.from(config.projects.values());
        expect(projectArr[0].messagesPath).toEqual(
          '/path/to/repo/subproject/locale',
        );
        expect(projectArr[0].translationsPath).toEqual(
          '/path/to/repo/subproject/locale',
        );
      });

      it('reads baseBranch', async () => {
        mock({
          '/path/to/repo/lyra.yml': [
            'baseBranch: branch1',
            'projects:',
            '- path: subproject',
            '  messages:',
            '    format: ts',
            '    path: anyValue',
            '  translations:',
            '    path: anyValue',
          ].join('\n'),
        });

        const config = await LyraConfig.get('/path/to/repo', false);
        expect(config.baseBranch).toEqual('branch1');
      });

      it('reads more than one projects', async () => {
        mock({
          '/path/to/repo/lyra.yml': [
            'projects:',
            '- path: subproject1',
            '  messages:',
            '    format: yaml',
            '    path: locale1',
            '  translations:',
            '    path: locale1',
            '- path: subproject2',
            '  messages:',
            '    format: ts',
            '    path: msg_locale2',
            '  translations:',
            '    path: trans_locale2',
          ].join('\n'),
        });

        const config = await LyraConfig.get('/path/to/repo', false);
        const projectArr = Array.from(config.projects.values());
        expect(config.projects.size).toEqual(2);

        expect(projectArr[0].path).toEqual('subproject1');
        expect(projectArr[0].messagesPath).toEqual(
          '/path/to/repo/subproject1/locale1',
        );
        expect(projectArr[0].translationsPath).toEqual(
          '/path/to/repo/subproject1/locale1',
        );
        expect(projectArr[0].messageKind).toEqual(MessageKind.YAML);

        expect(projectArr[1].path).toEqual('subproject2');
        expect(projectArr[1].messagesPath).toEqual(
          '/path/to/repo/subproject2/msg_locale2',
        );
        expect(projectArr[1].translationsPath).toEqual(
          '/path/to/repo/subproject2/trans_locale2',
        );
        expect(projectArr[1].messageKind).toEqual(MessageKind.TS);
      });

      describe('throw LyraConfigReadingError for invalid content or file not found', () => {
        it('throws for empty file', async () => {
          expect.assertions(1);
          mock({ '/path/to/repo/lyra.yml': '' });

          const promise = () => LyraConfig.get('/path/to/repo', false);
          await expect(promise).rejects.toThrow(LyraConfigReadingError);
        });

        it('throws for missing messages path', async () => {
          expect.assertions(1);
          mock({
            '/path/to/repo/lyra.yml': [
              'baseBranch: branch1',
              'projects:',
              '- path: subproject',
              '  messages:',
              '    format: ts',
              '  translations:',
              '    path: anyValue',
            ].join('\n'),
          });
          const promise = () => LyraConfig.get('/path/to/repo', false);
          await expect(promise).rejects.toThrow(LyraConfigReadingError);
        });

        it('throws for file not found', async () => {
          expect.assertions(1);
          mock({
            '/path/to/repo/xxx.yml': [
              'baseBranch: branch1',
              'projects:',
              '- path: subproject',
              '  messages:',
              '    format: ts',
              '    path: anyValue',
              '  translations:',
              '    path: anyValue',
            ].join('\n'),
          });
          const promise = () => LyraConfig.get('/path/to/repo', false);
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
        const config = await LyraConfig.get('/path/to/repo', false);
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
              '- path: subproject',
              '  messages:',
              '    format: yaml',
              '    path: locale',
              '  translations:',
              '    path: anyValue',
            ].join('\n'),
          });
          const config = await LyraConfig.get('/path/to/repo', false);
          const actual = () => config.getProjectConfigByPath('wrongPath');
          expect(actual).toThrow(ProjectPathNotFoundError);
        });
      });
    });
  });
  describe('ServerConfig', () => {
    describe('get()', () => {
      it('reads project property from server config projects', async () => {
        mock({
          '../config/projects.yaml': [
            'projects:',
            '  - name: foo',
            '    local_path: /path/to/repo',
            '    sub_project_path: ./subproject',
            '    host: github.com',
            '    owner: owner',
            '    repo: app.zetkin.org',
            '    github_token: github_123245',
          ].join('\n'),
        });
        const config = await ServerConfig.get(false);
        const projectConfigArr = Array.from(config.projects.values());

        expect(projectConfigArr[0].name).toEqual('foo');
        expect(projectConfigArr[0].localPath).toEqual('/path/to/repo');
        expect(projectConfigArr[0].subProjectPath).toEqual('./subproject');
        expect(projectConfigArr[0].host).toEqual('github.com');
        expect(projectConfigArr[0].owner).toEqual('owner');
        expect(projectConfigArr[0].repo).toEqual('app.zetkin.org');
        expect(projectConfigArr[0].githubToken).toEqual('github_123245');
      });
      it('reads multi project', async () => {
        mock({
          '../config/projects.yaml': [
            'projects:',
            '  - name: foo',
            '    local_path: /path/to/repo',
            '    sub_project_path: ./subproject1',
            '    host: github.com',
            '    owner: owner',
            '    repo: app.zetkin.org',
            '    github_token: github_123245',
            '  - name: bar',
            '    local_path: /path/to/repo',
            '    sub_project_path: ./subproject2',
            '    host: github.com',
            '    owner: owner',
            '    repo: app.zetkin.org',
            '    github_token: github_123245',
          ].join('\n'),
        });
        const config = await ServerConfig.get(false);
        const projectConfigArr = Array.from(config.projects.values());

        expect(projectConfigArr.length).toEqual(2);
        expect(projectConfigArr[0].name).toEqual('foo');
        expect(projectConfigArr[0].subProjectPath).toEqual('./subproject1');
        expect(projectConfigArr[1].name).toEqual('bar');
        expect(projectConfigArr[1].subProjectPath).toEqual('./subproject2');
      });
      it('throws for empty projects file', async () => {
        expect.assertions(1);
        mock({
          '../config/projects.yaml': '',
        });
        const actual = () => ServerConfig.get(false);
        await expect(actual).rejects.toThrow();
      });
      it('throws for missing projects file', async () => {
        expect.assertions(1);
        mock({
          './config/WrongFile.yaml': [
            'projects:',
            '  - name: foo',
            '    local_path: /path/to/repo',
            '    sub_project_path: ./subproject',
            '    host: github.com',
            '    owner: owner',
            '    repo: app.zetkin.org',
            '    github_token: github_123245',
          ].join('\n'),
        });
        const actual = () => ServerConfig.get(false);
        await expect(actual).rejects.toThrow(ServerConfigReadingError);
      });
    });
    describe('getProjectConfigByName()', () => {
      it('reads config of project by name', async () => {
        mock({
          '../config/projects.yaml': [
            'projects:',
            '  - name: foo',
            '    local_path: /path/to/repo',
            '    sub_project_path: ./subproject1',
            '    host: github.com',
            '    owner: owner',
            '    repo: app.zetkin.org',
            '    github_token: github_123245',
            '  - name: bar',
            '    local_path: /path/to/repo',
            '    sub_project_path: ./subproject2',
            '    host: github.com',
            '    owner: owner',
            '    repo: app.zetkin.org',
            '    github_token: github_123245',
          ].join('\n'),
        });
        const projectConfig = await ServerConfig.getProjectConfig('bar');
        expect(projectConfig.localPath).toEqual('/path/to/repo');
        expect(projectConfig.subProjectPath).toEqual('./subproject2');
      });

      it('throw ProjectNameNotFoundError for invalid project path', async () => {
        expect.assertions(1);
        mock({
          '../config/projects.yaml': [
            'projects:',
            '  - name: foo',
            '    local_path: /path/to/repo',
            '    sub_project_path: ./subproject1',
            '    host: github.com',
            '    owner: owner',
            '    repo: app.zetkin.org',
            '    github_token: github_123245',
          ].join('\n'),
        });
        const config = await ServerConfig.get();
        const actual = () => config.getProjectConfig('wrong_name');
        expect(actual).toThrow(ProjectNameNotFoundError);
      });
    });
  });
});
