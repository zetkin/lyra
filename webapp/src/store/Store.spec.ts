import { describe, expect, it } from '@jest/globals';

import Store from './Store';
import { LanguageNotFound, MessageNotFound } from '@/errors';

describe('Store', () => {
  it('returns empty object when empty', async () => {
    const store = new Store({
      getTranslations: async () => ({
        sv: {},
      }),
    });

    const translations = await store.getTranslations('sv');
    expect(translations).toEqual({});
  });

  it('returns correct language', async () => {
    const store = new Store({
      getTranslations: async () => ({
        de: {
          'greeting.headline': {
            sourceFile: '',
            text: 'Hallo',
          },
        },
        sv: {
          'greeting.headline': {
            sourceFile: '',
            text: 'Hej',
          },
        },
      }),
    });

    const translations = await store.getTranslations('de');
    expect(translations).toEqual({
      'greeting.headline': 'Hallo',
    });
  });

  it('throws exception for missing language', async () => {
    const store = new Store({
      getTranslations: async () => ({}),
    });

    const promise = store.getTranslations('fi');
    expect(promise).rejects.toThrowError(LanguageNotFound);
  });

  it('returns updated translations', async () => {
    const store = new Store({
      getTranslations: async () => ({
        de: {
          'greeting.headline': {
            sourceFile: '',
            text: 'Hallo',
          },
        },
      }),
    });

    const before = await store.getTranslations('de');
    await store.updateTranslation('de', 'greeting.headline', 'Hallo!');
    const after = await store.getTranslations('de');

    expect(before).toEqual({
      'greeting.headline': 'Hallo',
    });

    expect(after).toEqual({
      'greeting.headline': 'Hallo!',
    });
  });

  it('can update translations before getTranslations()', async () => {
    const store = new Store({
      getTranslations: async () => ({
        de: {
          'greeting.headline': {
            sourceFile: '',
            text: 'Hallo',
          },
        },
      }),
    });

    await store.updateTranslation('de', 'greeting.headline', 'Hallo!');
    const after = await store.getTranslations('de');

    expect(after).toEqual({
      'greeting.headline': 'Hallo!',
    });
  });

  it('throws exception for missing language', async () => {
    const store = new Store({
      getTranslations: async () => ({}),
    });

    const promise = store.updateTranslation(
      'de',
      'greeting.headline',
      'Hallo!'
    );

    expect(promise).rejects.toThrowError(LanguageNotFound);
  });

  it('throws exception for unknown message ID', async () => {
    const store = new Store({
      getTranslations: async () => ({
        de: {},
      }),
    });

    const promise = store.updateTranslation(
      'de',
      'greeting.headline',
      'Hallo!'
    );

    expect(promise).rejects.toThrowError(MessageNotFound);
  });
});
