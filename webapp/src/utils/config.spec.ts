import mock from 'mock-fs';
import { describe, expect, it } from '@jest/globals';
import { LyraConfig, MessageKind, ServerConfig } from './config';
import { LyraConfigReadingError, ProjectPathNotFoundError, ServerConfigReadingError } from '@/errors';

describe('config.ts', () => {
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
            '- path: subproject',
            '  messages:',
            '    format: yaml',
            '    path: locale',
            '  translations:',
            '    path: locale',
          ].join('\n'),
        });

        const config = await LyraConfig.readFromDir('/path/to/repo');
        expect(config.projects[0].messagesPath).toEqual(
          '/path/to/repo/subproject/locale',
        );
        expect(config.projects[0].translationsPath).toEqual(
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

        const config = await LyraConfig.readFromDir('/path/to/repo');
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

        const config = await LyraConfig.readFromDir('/path/to/repo');
        expect(config.projects.length).toEqual(2);

        expect(config.projects[0].path).toEqual('subproject1');
        expect(config.projects[0].messagesPath).toEqual(
          '/path/to/repo/subproject1/locale1',
        );
        expect(config.projects[0].translationsPath).toEqual(
          '/path/to/repo/subproject1/locale1',
        );
        expect(config.projects[0].messageKind).toEqual(MessageKind.YAML);

        expect(config.projects[1].path).toEqual('subproject2');
        expect(config.projects[1].messagesPath).toEqual(
          '/path/to/repo/subproject2/msg_locale2',
        );
        expect(config.projects[1].translationsPath).toEqual(
          '/path/to/repo/subproject2/trans_locale2',
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
              '- path: subproject',
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
              '- path: subproject',
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
              '- path: subproject',
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
          './config/projects.yaml': [
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
        const config = await ServerConfig.read();
        expect(config.projects[0].name).toEqual('foo');
        expect(config.projects[0].localPath).toEqual('/path/to/repo');
        expect(config.projects[0].subProjectPath).toEqual(
          '/path/to/repo/subproject',
        );
        expect(config.projects[0].host).toEqual('github.com');
        expect(config.projects[0].owner).toEqual('owner');
        expect(config.projects[0].repo).toEqual('app.zetkin.org');
        expect(config.projects[0].githubToken).toEqual('github_123245');
      });
      it('reads multi project', async () => {
        mock({
          './config/projects.yaml': [
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
        const config = await ServerConfig.read();
        expect(config.projects.length).toEqual(2);
        expect(config.projects[0].name).toEqual('foo');
        expect(config.projects[0].subProjectPath).toEqual(
          '/path/to/repo/subproject1',
        );
        expect(config.projects[1].name).toEqual('bar');
        expect(config.projects[1].subProjectPath).toEqual(
          '/path/to/repo/subproject2',
        );
      });
      it('throws for empty projects file', async () => {
        expect.assertions(1);
        mock({
          './config/projects.yaml': '',
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
            '    local_path: /path/to/repo',
            '    sub_project_path: ./subproject',
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
  });
});
