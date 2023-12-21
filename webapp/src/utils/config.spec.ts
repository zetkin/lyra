import { LyraConfigReadingError } from '@/errors';
import mock from 'mock-fs';
import { describe, expect, it } from '@jest/globals';
import LyraConfig, { MessageKind } from './config';

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

        const readFromDirFunc = () => LyraConfig.readFromDir('/path/to/repo');
        await expect(readFromDirFunc()).rejects.toThrow(LyraConfigReadingError);
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
        const readFromDirFunc = () => LyraConfig.readFromDir('/path/to/repo');
        await expect(readFromDirFunc()).rejects.toThrow(LyraConfigReadingError);
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
        const readFromDirFunc = () => LyraConfig.readFromDir('/path/to/repo');
        await expect(readFromDirFunc()).rejects.toThrow(LyraConfigReadingError);
      });
    });
  });
});
