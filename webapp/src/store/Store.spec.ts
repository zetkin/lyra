import { describe, expect, it } from '@jest/globals';

import Store from './Store';

describe('Store', () => {
  it('returns empty object when empty', async () => {
    const store = new Store({
      getTranslations: async () => ({}),
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
});
