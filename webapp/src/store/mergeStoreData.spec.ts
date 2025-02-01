import { describe, expect, it } from '@jest/globals';

import mergeStoreData from './mergeStoreData';
import { StoreData } from './types';
import { MessageData, MessageTranslation } from '@/utils/adapters';

describe('mergeStoreData()', () => {
  it('returns empty when both arguments are empty', () => {
    const inMemory: StoreData = {
      languages: {},
      messages: [],
    };

    const fromRepo: StoreData = {
      languages: {},
      messages: [],
    };

    const result = mergeStoreData(inMemory, fromRepo);

    expect(result).toEqual(fromRepo);
  });

  it('accepts fromRepo when inMemory is empty', () => {
    const inMemory: StoreData = {
      languages: {},
      messages: [],
    };

    const fromRepo: StoreData = {
      languages: {
        sv: {
          'project.title': mockTranslation('Zetkin'),
        },
      },
      messages: [mockMessage('project.title', 'Zetkin')],
    };

    const result = mergeStoreData(inMemory, fromRepo);
    expect(result).toEqual(fromRepo);
  });

  it('accepts new message', () => {
    const inMemory: StoreData = {
      languages: {
        sv: {
          'project.title': mockTranslation('Zetkin'),
        },
      },
      messages: [mockMessage('project.title', 'Zetkin')],
    };

    const fromRepo: StoreData = {
      languages: {
        sv: {
          'project.author': mockTranslation('Zetkin Foundation'),
          'project.title': mockTranslation('Zetkin'),
        },
      },
      messages: [
        mockMessage('project.title', 'Zetkin'),
        mockMessage('project.author', 'Zetkin Foundation'),
      ],
    };

    const result = mergeStoreData(inMemory, fromRepo);
    expect(result).toEqual(fromRepo);
  });

  it('removes translations when message disappears from repo', () => {
    const inMemory: StoreData = {
      languages: {
        sv: {
          'project.title': mockTranslation('Zetkin'),
        },
      },
      messages: [mockMessage('project.title', 'Zetkin')],
    };

    const fromRepo: StoreData = {
      languages: {},
      messages: [],
    };

    const result = mergeStoreData(inMemory, fromRepo);
    expect(result).toEqual(fromRepo);
  });

  it('retains translation from memory', () => {
    const inMemory: StoreData = {
      languages: {
        sv: {
          'project.title': mockTranslation('Zetkin'),
        },
      },
      messages: [mockMessage('project.title', 'Zetkin')],
    };

    const fromRepo: StoreData = {
      languages: {
        sv: {
          'project.title': mockTranslation('The Zetkin'),
        },
      },
      messages: [mockMessage('project.title', 'Zetkin')],
    };

    const result = mergeStoreData(inMemory, fromRepo);
    expect(result).toEqual(inMemory);
  });

  it('always returns languages, even if empty', () => {
    const inMemory: StoreData = {
      languages: {},
      messages: [],
    };

    const fromRepo: StoreData = {
      languages: {
        sv: {},
      },
      messages: [],
    };

    const result = mergeStoreData(inMemory, fromRepo);
    expect(result).toEqual(fromRepo);
  });

  it('should not return undefined if both memory and repo are falsy (undefined)', () => {
    const inMemory: StoreData = {
      languages: {
        sv: {},
      },
      messages: [],
    };

    const fromRepo: StoreData = {
      languages: {
        sv: {},
      },
      messages: [mockMessage('any.message.id', 'Default message')],
    };

    const result = mergeStoreData(inMemory, fromRepo);
    expect(result).toStrictEqual({
      languages: {
        sv: {},
      },
      messages: [mockMessage('any.message.id', 'Default message')],
    });
  });
});

const mockTranslation = (
  text: MessageTranslation['text'],
  sourceFile: MessageTranslation['sourceFile'] = 'thefile.yml',
) => ({
  sourceFile,
  text,
});

const mockMessage = (
  id: MessageData['id'],
  defaultMessage: MessageData['defaultMessage'],
  params: MessageData['params'] = [],
) => ({ defaultMessage, id, params });
