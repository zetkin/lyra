import { describe, it } from '@jest/globals';

describe.skip('Cache', () => {
  describe.skip('gitPull()', () => {
    it.todo('it call gitPull again for different repo path');
    it.todo('it does not call gitPull again for different project in a repo');
    it.todo('it does not call gitPull for same repo path');
  });
});
