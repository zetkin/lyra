import mock from 'mock-fs';
import { afterEach, describe, expect, it } from '@jest/globals';

import YamlTranslationAdapter from './YamlTranslationAdapter';
import { TranslateState } from '@/utils/adapters/index';

describe('YamlTranslationAdapter', () => {
  describe('getTranslations()', () => {
    afterEach(() => {
      mock.restore();
    });

    it('Reads translations for multiple languages', async () => {
      mock({
        '/path/to/repo/locale/de.yml': 'no: Nein',
        '/path/to/repo/locale/sv.yml': 'no: Nej',
      });

      const adapter = new YamlTranslationAdapter('/path/to/repo/locale');
      const translations = await adapter.getTranslations();

      expect(translations).toEqual({
        de: {
          no: {
            sourceFile: 'de.yml',
            state: TranslateState.PUBLISHED,
            text: 'Nein',
          },
        },
        sv: {
          no: {
            sourceFile: 'sv.yml',
            state: TranslateState.PUBLISHED,
            text: 'Nej',
          },
        },
      });
    });

    it('Reads single language', async () => {
      mock({
        '/path/to/repo/locale/de.yml': 'no: Nein',
      });

      const adapter = new YamlTranslationAdapter('/path/to/repo/locale');
      const translations = await adapter.getTranslations();

      expect(translations).toEqual({
        de: {
          no: {
            sourceFile: 'de.yml',
            state: TranslateState.PUBLISHED,
            text: 'Nein',
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

      const adapter = new YamlTranslationAdapter('/path/to/repo/locale');
      const translations = await adapter.getTranslations();

      expect(translations).toEqual({
        de: {
          'options.no': {
            sourceFile: 'de.yml',
            state: TranslateState.PUBLISHED,
            text: 'Nein',
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

      const adapter = new YamlTranslationAdapter('/path/to/repo/locale');
      const translations = await adapter.getTranslations();

      expect(translations).toEqual({
        de: {
          'my.feature.options.no': {
            sourceFile: 'my/feature/de.yml',
            state: TranslateState.PUBLISHED,
            text: 'Nein',
          },
        },
      });
    });
  });
});
