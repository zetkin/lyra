import { ProjectStore } from './ProjectStore';
import { describe, expect, it } from '@jest/globals';
import { LanguageNotFound, MessageNotFound } from '@/errors';

describe('ProjectStore', () => {
  it('returns empty object when empty', async () => {
    const projectStore = new ProjectStore({
      getTranslations: async () => ({
        sv: {},
      }),
    });

    const actual = await projectStore.getTranslations('sv');
    expect(actual).toEqual({});
  });

  it('returns correct language', async () => {
    const projectStore = new ProjectStore({
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

    const actual = await projectStore.getTranslations('de');
    expect(actual).toEqual({
      'greeting.headline': 'Hallo',
    });
  });

  it('throws exception for missing language', async () => {
    expect.assertions(1);
    const projectStore = new ProjectStore({
      getTranslations: async () => ({}),
    });

    const actual = projectStore.getTranslations('fi');
    await expect(actual).rejects.toThrowError(LanguageNotFound);
  });

  it('returns updated translations', async () => {
    const projectStore = new ProjectStore({
      getTranslations: async () => ({
        de: {
          'greeting.headline': {
            sourceFile: '',
            text: 'Hallo',
          },
        },
      }),
    });

    const before = await projectStore.getTranslations('de');
    await projectStore.updateTranslation('de', 'greeting.headline', 'Hallo!');
    const after = await projectStore.getTranslations('de');

    expect(before).toEqual({
      'greeting.headline': 'Hallo',
    });

    expect(after).toEqual({
      'greeting.headline': 'Hallo!',
    });
  });

  it('can update translations before getTranslations()', async () => {
    const projectStore = new ProjectStore({
      getTranslations: async () => ({
        de: {
          'greeting.headline': {
            sourceFile: '',
            text: 'Hallo',
          },
        },
      }),
    });

    await projectStore.updateTranslation('de', 'greeting.headline', 'Hallo!');
    const actual = await projectStore.getTranslations('de');

    expect(actual).toEqual({
      'greeting.headline': 'Hallo!',
    });
  });

  it('throws exception for missing language', async () => {
    expect.assertions(1);
    const projectStore = new ProjectStore({
      getTranslations: async () => ({}),
    });

    const actual = projectStore.updateTranslation(
      'de',
      'greeting.headline',
      'Hallo!',
    );

    await expect(actual).rejects.toThrowError(LanguageNotFound);
  });

  it('throws exception for unknown message ID', async () => {
    expect.assertions(1);
    const projectStore = new ProjectStore({
      getTranslations: async () => ({
        de: {},
      }),
    });

    const actual = projectStore.updateTranslation(
      'de',
      'greeting.headline',
      'Hallo!',
    );

    await expect(actual).rejects.toThrowError(MessageNotFound);
  });

  it('gives full access to all languages', async () => {
    const projectStore = new ProjectStore({
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

    const languages = await projectStore.getLanguageData();
    expect(languages).toEqual({
      de: {
        'greeting.headline': 'Hallo',
      },
      sv: {
        'greeting.headline': 'Hej',
      },
    });
  });
});
