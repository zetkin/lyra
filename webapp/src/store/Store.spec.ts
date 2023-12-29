import { Store } from './Store';
import { describe, expect, it } from '@jest/globals';

describe('Store', () => {
  it('throws ProjectStore not found ', async () => {
    const store = new Store();
    expect(() => store.getProjectStore('repoPath', 'projectPath')).toThrowError(
      'ProjectStore not found for path: repoPath/projectPath',
    );
  });
});
