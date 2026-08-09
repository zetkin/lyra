import mock from 'mock-fs';
import {
  afterEach,
  describe,
  expect,
  it,
  beforeEach,
  jest,
} from '@jest/globals';

import { debug } from '@/utils/log';

describe('log.ts', () => {
  afterEach(() => {
    mock.restore();
  });

  describe('debug()', () => {
    let consoleDebugSpy: jest.SpiedFunction<typeof console.debug>;

    beforeEach(() => {
      // eslint-disable-next-line no-console
      consoleDebugSpy = jest
        .spyOn(console, 'debug')
        .mockImplementation(() => {});
    });

    afterEach(() => {
      jest.resetAllMocks();
    });

    it('should log debug message when DEBUG is set to "1"', () => {
      process.env.DEBUG = '1';

      const message: string = 'This is a debug message';

      debug(message);

      expect(consoleDebugSpy).toHaveBeenCalledWith(`[DEBUG] ${message}`);
    });

    it('should not log debug message when DEBUG is not set to "1"', () => {
      process.env.DEBUG = '0';

      debug('This should not be logged');

      expect(consoleDebugSpy).not.toHaveBeenCalled();
    });
  });
});
