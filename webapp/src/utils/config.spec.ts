import { describe, expect, it } from '@jest/globals';
import LyraConfig, { MessageKind } from './config';
import mock from 'mock-fs';

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
      expect(config.messageKind).toEqual(MessageKind.YAML);
      expect(config.messagesPath).toEqual('/path/to/repo/locale');
      expect(config.translationsPath).toEqual('/path/to/repo/locale');
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
      expect(config.messagesPath).toEqual('/path/to/repo/subproject/locale');
      expect(config.translationsPath).toEqual(
        '/path/to/repo/subproject/locale'
      );
    });
  });
});
