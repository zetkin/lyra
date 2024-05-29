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
            sourceFile: 'de-with_extra_text.yaml',
            text: 'Hallo',
          },
        },
        sv: {
          'greeting.headline': {
            sourceFile: 'sv.yaml',
            text: 'Hej',
          },
        },
      }),
    });

    const actual = await projectStore.getTranslations('de');
    expect(actual).toEqual({
      'greeting.headline': {
        sourceFile: 'de-with_extra_text.yaml',
        text: 'Hallo',
      },
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
            sourceFile: 'anything',
            text: 'Hallo',
          },
        },
      }),
    });

    const beforeTranslate = await projectStore.getTranslations('de');
    const before = beforeTranslate['greeting.headline'].text;
    await projectStore.updateTranslation('de', 'greeting.headline', 'Hallo!');
    const afterTranslate = await projectStore.getTranslations('de');
    const after = afterTranslate['greeting.headline'].text;

    expect(before).toEqual('Hallo');

    expect(after).toEqual('Hallo!');
  });

  it('can update translations before getTranslations()', async () => {
    const projectStore = new ProjectStore({
      getTranslations: async () => ({
        de: {
          'greeting.headline': {
            sourceFile: 'anything',
            text: 'Hallo',
          },
        },
      }),
    });

    await projectStore.updateTranslation('de', 'greeting.headline', 'Hallo!');
    const actual = await projectStore.getTranslations('de');

    expect(actual).toEqual({
      'greeting.headline': { sourceFile: 'anything', text: 'Hallo!' },
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
    });
  });
});
