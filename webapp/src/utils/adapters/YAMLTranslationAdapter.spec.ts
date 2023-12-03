import { describe, expect, it } from '@jest/globals';
import mock from 'mock-fs';
import YAMLTranslationAdapter from './YAMLTranslationAdapter';

describe('YAMLTranslationAdapter', () => {
  describe('getTranslations()', () => {
    it('Reads translations for multiple languages', async () => {
      mock({
        '/path/to/repo/locale/de.yml': 'no: Nein',
        '/path/to/repo/locale/sv.yml': 'no: Nej',
      });

      const adapter = new YAMLTranslationAdapter('/path/to/repo/locale');
      const translations = await adapter.getTranslations();

      expect(translations).toEqual({
        de: {
          no: {
            text: 'Nein',
            sourceFile: 'de.yml',
          },
        },
        sv: {
          no: {
            text: 'Nej',
            sourceFile: 'sv.yml',
          },
        },
      });
    });

    it('Reads single language', async () => {
      mock({
        '/path/to/repo/locale/de.yml': 'no: Nein',
      });

      const adapter = new YAMLTranslationAdapter('/path/to/repo/locale');
      const translations = await adapter.getTranslations();

      expect(translations).toEqual({
        de: {
          no: {
            text: 'Nein',
            sourceFile: 'de.yml',
          },
        },
      });
    });

    it('Reads complex object for single langauge', async () => {
      mock({
        '/path/to/repo/locale/de.yml': [
          // YAML
          'options:',
          '  no: Nein',
        ].join('\n'),
      });

      const adapter = new YAMLTranslationAdapter('/path/to/repo/locale');
      const translations = await adapter.getTranslations();

      expect(translations).toEqual({
        de: {
          'options.no': {
            text: 'Nein',
            sourceFile: 'de.yml',
          },
        },
      });
    });

    it('Combines file path and object path for ID', async () => {
      mock({
        '/path/to/repo/locale/my/feature/de.yml': [
          // YAML
          'options:',
          '  no: Nein',
        ].join('\n'),
      });

      const adapter = new YAMLTranslationAdapter('/path/to/repo/locale');
      const translations = await adapter.getTranslations();

      expect(translations).toEqual({
        de: {
          'my.feature.options.no': {
            text: 'Nein',
            sourceFile: 'my/feature/de.yml',
          },
        },
      });
    });
  });
});
