import { describe, expect, it, jest } from '@jest/globals';

import { ProjectStore } from '@/store/ProjectStore';
import { Store } from './Store';
import { IMessageAdapter, TranslateState } from '@/utils/adapters';

describe('Store', () => {
  const mockMsgAdapter: jest.Mocked<IMessageAdapter> = {
    getMessages: jest
      .fn<IMessageAdapter['getMessages']>()
      .mockResolvedValue([]),
  };

  describe('getProjectStore()', () => {
    it('get ProjectStore for a path', async () => {
      const store = new Store();
      const projectStore = new ProjectStore(mockMsgAdapter, {
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
      store.addProjectStore('repoPath/projectPath', projectStore);
      const actual = store.getProjectStore('repoPath/projectPath');
      expect(actual).toBe(projectStore);
    });

    it('throws "ProjectStore not found for ..."', async () => {
      const store = new Store();
      expect(() => store.getProjectStore('repoPath/projectPath')).toThrowError(
        'ProjectStore not found for path: repoPath/projectPath',
      );
    });
  });
  describe('hasProjectStore()', () => {
    it('get ProjectStore for a path', async () => {
      const store = new Store();
      const projectStore = new ProjectStore(mockMsgAdapter, {
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
      store.addProjectStore('repoPath/projectPath', projectStore);
      const actual = store.hasProjectStore('repoPath/projectPath');
      const actualWrong = store.hasProjectStore('wrong/projectPath2');

      expect(actual).toEqual(true);
      expect(actualWrong).toEqual(false);
    });
  });
});
