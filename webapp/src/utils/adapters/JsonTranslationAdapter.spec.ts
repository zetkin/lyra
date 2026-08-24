import mock from 'mock-fs';
import { afterEach, describe, expect, it } from '@jest/globals';

import JsonTranslationAdapter from './JsonTranslationAdapter';
import { TranslateState } from '@/utils/adapters/index';

describe('JsonTranslationAdapter', () => {
  describe('getTranslations()', () => {
    afterEach(() => {
      mock.restore();
    });

    it('Reads translations for multiple languages', async () => {
      mock({
        '/path/to/repo/locale/de.json': JSON.stringify({ no: 'Nein' }),
        '/path/to/repo/locale/sv.json': JSON.stringify({ no: 'Nej' }),
      });

      const adapter = new JsonTranslationAdapter('/path/to/repo/locale');
      const translations = await adapter.getTranslations();

      expect(translations).toEqual({
        de: {
          no: {
            sourceFile: 'de.json',
            state: TranslateState.PUBLISHED,
            text: 'Nein',
          },
        },
        sv: {
          no: {
            sourceFile: 'sv.json',
            state: TranslateState.PUBLISHED,
            text: 'Nej',
          },
        },
      });
    });

    it('Reads single language', async () => {
      mock({
        '/path/to/repo/locale/de.json': JSON.stringify({ no: 'Nein' }),
      });

      const adapter = new JsonTranslationAdapter('/path/to/repo/locale');
      const translations = await adapter.getTranslations();

      expect(translations).toEqual({
        de: {
          no: {
            sourceFile: 'de.json',
            state: TranslateState.PUBLISHED,
            text: 'Nein',
          },
        },
      });
    });

    it('Reads complex object for single language', async () => {
      mock({
        '/path/to/repo/locale/de.json': JSON.stringify({
          options: { no: 'Nein' },
        }),
      });

      const adapter = new JsonTranslationAdapter('/path/to/repo/locale');
      const translations = await adapter.getTranslations();

      expect(translations).toEqual({
        de: {
          'options.no': {
            sourceFile: 'de.json',
            state: TranslateState.PUBLISHED,
            text: 'Nein',
          },
        },
      });
    });

    it('Combines file path and object path for ID', async () => {
      mock({
        '/path/to/repo/locale/my/feature/de.json': JSON.stringify({
          options: { no: 'Nein' },
        }),
      });

      const adapter = new JsonTranslationAdapter('/path/to/repo/locale');
      const translations = await adapter.getTranslations();

      expect(translations).toEqual({
        de: {
          'my.feature.options.no': {
            sourceFile: 'my/feature/de.json',
            state: TranslateState.PUBLISHED,
            text: 'Nein',
          },
        },
      });
    });

    it('Does not read yaml files', async () => {
      mock({
        '/path/to/repo/locale/de.json': JSON.stringify({ no: 'Nein' }),
        '/path/to/repo/locale/sv.yml': 'no: Nej',
      });

      const adapter = new JsonTranslationAdapter('/path/to/repo/locale');
      const translations = await adapter.getTranslations();

      expect(translations).toEqual({
        de: {
          no: {
            sourceFile: 'de.json',
            state: TranslateState.PUBLISHED,
            text: 'Nein',
          },
        },
      });
    });
  });
});
