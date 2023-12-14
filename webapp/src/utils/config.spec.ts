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
          '    format: yaml',
          '    path: locale',
        ].join('\n'),
      });
      const config = await LyraConfig.readFromDir('/path/to/repo');
      expect(config.projects[0].messageKind).toEqual(MessageKind.YAML);
      expect(config.projects[0].messagesPath).toEqual('/path/to/repo/locale');
      expect(config.projects[0].translationsPath).toEqual(
        '/path/to/repo/locale'
      );
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
          '    format: yaml',
          '    path: locale',
        ].join('\n'),
      });

      const config = await LyraConfig.readFromDir('/path/to/repo');
      expect(config.projects[0].messagesPath).toEqual(
        '/path/to/repo/subproject/locale'
      );
      expect(config.projects[0].translationsPath).toEqual(
        '/path/to/repo/subproject/locale'
      );
    });

    it('rad more than one projects', async () => {
      mock({
        '/path/to/repo/lyra.yml': [
          'projects:',
          '- path: subproject1',
          '  messages:',
          '    format: yaml',
          '    path: locale1',
          '  translations:',
          '    format: yaml',
          '    path: locale1',
          '- path: subproject2',
          '  messages:',
          '    format: ts',
          '    path: msg_locale2',
          '  translations:',
          '    format: ts',
          '    path: trans_locale2',
        ].join('\n'),
      });

      const config = await LyraConfig.readFromDir('/path/to/repo');
      expect(config.projects[0].messagesPath).toEqual(
        '/path/to/repo/subproject1/locale1'
      );
      expect(config.projects[0].translationsPath).toEqual(
        '/path/to/repo/subproject1/locale1'
      );
      expect(config.projects[0].messageKind).toEqual(MessageKind.YAML);
      expect(config.projects[1].messagesPath).toEqual(
        '/path/to/repo/subproject2/msg_locale2'
      );
      expect(config.projects[1].translationsPath).toEqual(
        '/path/to/repo/subproject2/trans_locale2'
      );
      expect(config.projects[1].messageKind).toEqual(MessageKind.TS);
    });
  });
});
