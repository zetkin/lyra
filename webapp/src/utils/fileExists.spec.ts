import { describe, expect, it, jest } from '@jest/globals';
import fs from 'fs/promises';
import { Stats } from 'node:fs';

import { fileExists } from './fileExists';

jest.mock('fs/promises');

describe('fileExists function', () => {
  it('should return true if the file exists', async () => {
    const path = 'existing-file.txt';
    (fs.stat as jest.Mock<typeof fs.stat>).mockResolvedValueOnce({} as Stats);

    const result = await fileExists(path);

    expect(result).toBe(true);
    expect(fs.stat).toHaveBeenCalledWith(path);
  });

  it('should return false if the file does not exist', async () => {
    const path = 'non-existing-file.txt';
    (fs.stat as jest.Mock<typeof fs.stat>).mockRejectedValueOnce(
      new Error('File not found'),
    );

    const result = await fileExists(path);

    expect(result).toBe(false);
    expect(fs.stat).toHaveBeenCalledWith(path);
  });
});
