import { describe, expect, it, jest } from '@jest/globals';

import { ProjectStore } from './ProjectStore';
import { LanguageNotFound, MessageNotFound } from '@/errors';
import { IMessageAdapter } from '@/utils/adapters';

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
      'greeting.headline': { sourceFile: '', text: 'Hallo' },
    });
  });

  it('throws exception for missing language', async () => {
    expect.assertions(1);
    const msgAdapter = mockMsgAdapter();
    msgAdapter.getMessages.mockResolvedValue([]);
    const projectStore = new ProjectStore(msgAdapter, {
      getTranslations: async () => ({}),
    });

    const actual = projectStore.getTranslations('fi');
    await expect(actual).rejects.toThrowError(LanguageNotFound);
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
        text: 'Hallo',
      },
    });
    expect(after).toEqual({
      'greeting.headline': {
        sourceFile: '',
        text: 'Hallo!',
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
        text: 'Hallo!',
      },
    });
  });

  it('throws exception for missing language', async () => {
    expect.assertions(1);
    const msgAdapter = mockMsgAdapter();
    msgAdapter.getMessages.mockResolvedValue([
      {
        defaultMessage: '',
        id: 'greeting.headline',
        params: [],
      },
    ]);
    const projectStore = new ProjectStore(msgAdapter, {
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
