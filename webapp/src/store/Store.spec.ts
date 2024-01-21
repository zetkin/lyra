import { ProjectStore } from '@/store/ProjectStore';
import { Store } from './Store';
import { describe, expect, it } from '@jest/globals';

describe('Store', () => {
  describe('getProjectStore()', () => {
    it('get ProjectStore for a path', async () => {
      const store = new Store();
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
      store.addProjectStore('repoPath/projectPath', projectStore);
      const actual = store.getProjectStore('repoPath/projectPath');
      expect(actual).toEqual(projectStore);
    });
    it('throws "ProjectStore not found for ..."', async () => {
      const store = new Store();
      expect(() =>
        store.getProjectStore('repoPath/projectPath'),
      ).toThrowError('ProjectStore not found for path: repoPath/projectPath');
    });
  });
  describe('hasProjectStore()', () => {
    it('get ProjectStore for a path', async () => {
      const store = new Store();
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
      store.addProjectStore('repoPath/projectPath', projectStore);
      const actual = store.hasProjectStore('repoPath/projectPath');
      const actualWrong = store.hasProjectStore('wrong/projectPath2');

      expect(actual).toEqual(true);
      expect(actualWrong).toEqual(false);
    });
  });
});
