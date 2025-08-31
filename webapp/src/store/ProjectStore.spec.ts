import { describe, expect, it, jest } from '@jest/globals';

import { ProjectStore } from './ProjectStore';
import { IMessageAdapter, TranslateState } from '@/utils/adapters';

function mockMsgAdapter(): jest.Mocked<IMessageAdapter> {
  return {
    getMessages: jest.fn<IMessageAdapter['getMessages']>(),
  };
}

describe('ProjectStore', () => {
  it('returns empty object when empty', async () => {
    const msgAdapter = mockMsgAdapter();
    msgAdapter.getMessages.mockResolvedValue([]);

    const projectStore = new ProjectStore(msgAdapter, {
      getTranslations: async () => ({
        sv: {},
      }),
    });

    const actual = await projectStore.getTranslations('sv');
    expect(actual).toEqual({});
  });

  it('returns correct language', async () => {
    const msgAdapter = mockMsgAdapter();
    msgAdapter.getMessages.mockResolvedValue([
      {
        defaultMessage: '',
        id: 'greeting.headline',
        params: [],
      },
    ]);

    const projectStore = new ProjectStore(msgAdapter, {
      getTranslations: async () => ({
        de: {
          'greeting.headline': {
            sourceFile: '',
            state: TranslateState.PUBLISHED,
            text: 'Hallo',
          },
        },
        sv: {
          'greeting.headline': {
            sourceFile: '',
            state: TranslateState.PUBLISHED,
            text: 'Hej',
          },
        },
      }),
    });

    const actual = await projectStore.getTranslations('de');
    expect(actual).toEqual({
      'greeting.headline': {
        sourceFile: '',
        state: TranslateState.PUBLISHED,
        text: 'Hallo',
      },
    });
  });

  it('returns empty object for missing language', async () => {
    expect.assertions(1);
    const msgAdapter = mockMsgAdapter();
    msgAdapter.getMessages.mockResolvedValue([]);
    const projectStore = new ProjectStore(msgAdapter, {
      getTranslations: async () => ({}),
    });

    const actual = await projectStore.getTranslations('fi');
    expect(actual).toEqual({});
  });

  it('returns updated translations', async () => {
    const msgAdapter = mockMsgAdapter();
    msgAdapter.getMessages.mockResolvedValue([
      {
        defaultMessage: '',
        id: 'greeting.headline',
        params: [],
      },
    ]);

    const projectStore = new ProjectStore(msgAdapter, {
      getTranslations: async () => ({
        de: {
          'greeting.headline': {
            sourceFile: '',
            state: TranslateState.PUBLISHED,
            text: 'Hallo',
          },
        },
      }),
    });

    const before = await projectStore.getTranslations('de');
    await projectStore.updateTranslation('de', 'greeting.headline', 'Hallo!');
    const after = await projectStore.getTranslations('de');

    expect(before).toEqual({
      'greeting.headline': {
        sourceFile: '',
        state: TranslateState.PUBLISHED,
        text: 'Hallo',
      },
    });
    expect(after).toEqual({
      'greeting.headline': {
        sourceFile: '',
        state: TranslateState.UPDATED,
        text: 'Hallo!',
        timestamp: expect.any(Number),
      },
    });
  });

  it('can update translations before getTranslations()', async () => {
    const msgAdapter = mockMsgAdapter();
    msgAdapter.getMessages.mockResolvedValue([
      {
        defaultMessage: '',
        id: 'greeting.headline',
        params: [],
      },
    ]);

    const projectStore = new ProjectStore(msgAdapter, {
      getTranslations: async () => ({
        de: {
          'greeting.headline': {
            sourceFile: '',
            state: TranslateState.PUBLISHED,
            text: 'Hallo',
          },
        },
      }),
    });

    await projectStore.updateTranslation('de', 'greeting.headline', 'Hallo!');
    const actual = await projectStore.getTranslations('de');

    expect(actual).toEqual({
      'greeting.headline': {
        sourceFile: '',
        state: TranslateState.UPDATED,
        text: 'Hallo!',
        timestamp: expect.any(Number),
      },
    });
  });

  describe('updateTranslation', () => {
    it('does not prefix source file with /', async () => {
      const store = new ProjectStore(
        {
          getMessages: async () => [
            {
              defaultMessage: 'Click',
              id: 'core.click',
              params: [],
            },
          ],
        },
        {
          getTranslations: async () => ({
            en: {
              'core.click': {
                sourceFile: 'en.yml',
                state: TranslateState.PUBLISHED,
                text: 'Click',
              },
            },
          }),
        },
      );

      await store.updateTranslation('sv', 'core.click', 'Klicka');

      const actual = await store.getTranslations('sv');
      expect(actual['core.click'].sourceFile).toEqual('sv.yml');
    });
  });

  it('gives full access to all languages', async () => {
    const msgAdapter = mockMsgAdapter();
    msgAdapter.getMessages.mockResolvedValue([
      {
        defaultMessage: '',
        id: 'greeting.headline',
        params: [],
      },
    ]);
    const projectStore = new ProjectStore(msgAdapter, {
      getTranslations: async () => ({
        de: {
          'greeting.headline': {
            sourceFile: '',
            state: TranslateState.PUBLISHED,
            text: 'Hallo',
          },
        },
        sv: {
          'greeting.headline': {
            sourceFile: '',
            state: TranslateState.PUBLISHED,
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
          state: TranslateState.PUBLISHED,
          text: 'Hallo',
        },
      },
      sv: {
        'greeting.headline': {
          sourceFile: '',
          state: TranslateState.PUBLISHED,
          text: 'Hej',
        },
      },
    });
  });
});
