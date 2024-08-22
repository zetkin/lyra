import { describe, expect, it } from '@jest/globals';

import { getTranslationsIdText } from './translationObjectUtil';

describe('translationObjectUtil', () => {
  describe('getTranslationsIdText()', () => {
    it('returns empty object for empty obj', () => {
      const actual = getTranslationsIdText({});
      expect(actual).toEqual({});
    });
    it('dehydrate obj one property', () => {
      const actual = getTranslationsIdText({
        a: { sourceFile: '', text: 'A' },
      });
      expect(actual).toEqual({ a: 'A' });
    });
    it('unflat simple obj one object property', () => {
      const actual = getTranslationsIdText({
        'a.b.c': { sourceFile: '', text: 'ABC' },
      });
      expect(actual).toEqual({ 'a.b.c': 'ABC' });
    });
    it('unflat two properties obj', () => {
      const actual = getTranslationsIdText({
        'a.b.c': { sourceFile: '', text: 'ABC' },
        'a.b.e': { sourceFile: '', text: 'ABE' },
      });
      const expected = {
        'a.b.c': 'ABC',
        'a.b.e': 'ABE',
      };
      expect(actual).toEqual(expected);
    });
  });
});
