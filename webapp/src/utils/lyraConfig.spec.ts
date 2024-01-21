import mock from 'mock-fs';
import { afterEach, describe, expect, it } from '@jest/globals';
import { LyraConfig, MessageKind } from './lyraConfig';
import { LyraConfigReadingError, ProjectPathNotFoundError } from '@/errors';

describe('LyraConfig', () => {
  afterEach(() => {
    mock.restore();
  });

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
      expect(config.projects[0].absMessagesPath).toEqual('/path/to/repo/locale');
      expect(config.projects[0].absTranslationsPath).toEqual(
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
      expect(config.projects[0].absMessagesPath).toEqual(
        '/path/to/repo/project/locale',
      );
      expect(config.projects[0].absTranslationsPath).toEqual(
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

      expect(config.projects[0].relativePath).toEqual('project1');
      expect(config.projects[0].absPath).toEqual('/path/to/repo/project1');
      expect(config.projects[0].absMessagesPath).toEqual(
        '/path/to/repo/project1/locale1',
      );
      expect(config.projects[0].absTranslationsPath).toEqual(
        '/path/to/repo/project1/locale1',
      );
      expect(config.projects[0].messageKind).toEqual(MessageKind.YAML);

      expect(config.projects[1].relativePath).toEqual('project2');
      expect(config.projects[1].absPath).toEqual('/path/to/repo/project2');
      expect(config.projects[1].absMessagesPath).toEqual(
        '/path/to/repo/project2/msg_locale2',
      );
      expect(config.projects[1].absTranslationsPath).toEqual(
        '/path/to/repo/project2/trans_locale2',
      );
      expect(config.projects[1].messageKind).toEqual(MessageKind.TS);
    });

    describe('LyraConfigReadingError', () => {
      it('throws for empty file', async () => {
        expect.assertions(1);
        mock({ '/path/to/repo/lyra.yml': '' });

        const actual = LyraConfig.readFromDir('/path/to/repo');
        await expect(actual).rejects.toThrow(LyraConfigReadingError);
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
        const actual = LyraConfig.readFromDir('/path/to/repo');
        await expect(actual).rejects.toThrow(LyraConfigReadingError);
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
        const actual = LyraConfig.readFromDir('/path/to/repo');
        await expect(actual).rejects.toThrow(LyraConfigReadingError);
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
      expect(projectConfig.absMessagesPath).toEqual('/path/to/repo/foo/locale');
      expect(projectConfig.absTranslationsPath).toEqual(
        '/path/to/repo/foo/locale',
      );
      expect(config.baseBranch).toEqual('main'); // default value
    });

    describe('ProjectPathNotFoundError', () => {
      it('throws for for invalid project path', async () => {
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
