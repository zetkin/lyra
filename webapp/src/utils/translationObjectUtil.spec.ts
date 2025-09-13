import { describe, expect, it } from '@jest/globals';

import {
  getPrefixKeyFromSourceFile,
  getTranslationsBySourceFile,
  getTranslationsIdTextState,
  removePrefix,
} from './translationObjectUtil';
import { TranslateState } from './adapters';

describe('translationObjectUtil', () => {
  describe('getTranslationsIdText()', () => {
    it('returns empty object for empty obj', () => {
      const actual = getTranslationsIdTextState({});
      expect(actual).toEqual({});
    });

    it('dehydrate obj one property', () => {
      const actual = getTranslationsIdTextState({
        a: { sourceFile: '', state: TranslateState.PUBLISHED, text: 'A' },
      });
      expect(actual).toEqual({
        a: { state: TranslateState.PUBLISHED, text: 'A' },
      });
    });

    it('unflat simple obj one object property', () => {
      const actual = getTranslationsIdTextState({
        'a.b.c': {
          sourceFile: '',
          state: TranslateState.PUBLISHED,
          text: 'ABC',
        },
      });
      expect(actual).toEqual({
        'a.b.c': { state: TranslateState.PUBLISHED, text: 'ABC' },
      });
    });

    it('unflat two properties obj', () => {
      const actual = getTranslationsIdTextState({
        'a.b.c': {
          sourceFile: '',
          state: TranslateState.PUBLISHED,
          text: 'ABC',
        },
        'a.b.e': {
          sourceFile: '',
          state: TranslateState.PUBLISHED,
          text: 'ABE',
        },
      });
      const expected = {
        'a.b.c': { state: TranslateState.PUBLISHED, text: 'ABC' },
        'a.b.e': { state: TranslateState.PUBLISHED, text: 'ABE' },
      };
      expect(actual).toEqual(expected);
    });
  });
  describe('getTranslationsBySourceFile()', () => {
    it('returns empty object for empty obj', () => {
      const actual = getTranslationsBySourceFile({});
      expect(actual).toEqual({});
    });

    it('group by sourceFile obj one property', () => {
      const actual = getTranslationsBySourceFile({
        a: {
          sourceFile: 'en.yaml',
          state: TranslateState.PUBLISHED,
          text: 'A',
        },
      });
      expect(actual).toEqual({
        'en.yaml': { a: { state: TranslateState.PUBLISHED, text: 'A' } },
      });
    });

    it('group by sourceFile simple obj one object property', () => {
      const actual = getTranslationsBySourceFile({
        'a.b.c': {
          sourceFile: 'en.yaml',
          state: TranslateState.PUBLISHED,
          text: 'ABC',
        },
      });
      expect(actual).toEqual({
        'en.yaml': {
          'a.b.c': { state: TranslateState.PUBLISHED, text: 'ABC' },
        },
      });
    });

    it('group by sourceFile two properties obj', () => {
      const actual = getTranslationsBySourceFile({
        'f1.a.b.c': {
          sourceFile: 'f1/en.yaml',
          state: TranslateState.PUBLISHED,
          text: 'ABC',
        },
        'f2.a.b.e': {
          sourceFile: 'f2/en.yml',
          state: TranslateState.PUBLISHED,
          text: 'ABE',
        },
      });
      const expected = {
        'f1/en.yaml': {
          'a.b.c': { state: TranslateState.PUBLISHED, text: 'ABC' },
        },
        'f2/en.yml': {
          'a.b.e': { state: TranslateState.PUBLISHED, text: 'ABE' },
        },
      };
      expect(actual).toEqual(expected);
    });

    it('group by sourceFile two sourceFiles obj', () => {
      const actual = getTranslationsBySourceFile({
        'f1.a.b.c': {
          sourceFile: 'f1/en.yaml',
          state: TranslateState.PUBLISHED,
          text: 'ABC',
        },
        'f1.a.b.e': {
          sourceFile: 'f1/en.yaml',
          state: TranslateState.PUBLISHED,
          text: 'ABE',
        },
        'f2.a.b.f': {
          sourceFile: 'f2/en.yml',
          state: TranslateState.PUBLISHED,
          text: 'ABF',
        },
      });
      const expected = {
        'f1/en.yaml': {
          'a.b.c': { state: TranslateState.PUBLISHED, text: 'ABC' },
          'a.b.e': { state: TranslateState.PUBLISHED, text: 'ABE' },
        },
        'f2/en.yml': {
          'a.b.f': { state: TranslateState.PUBLISHED, text: 'ABF' },
        },
      };
      expect(actual).toEqual(expected);
    });
  });
  describe('getPrefixKeyFromSourceFile()', () => {
    it('returns empty string for empty string', () => {
      const actual = getPrefixKeyFromSourceFile('');
      expect(actual).toEqual('');
    });

    it('returns empty string for no path', () => {
      const actual = getPrefixKeyFromSourceFile('en.yaml');
      expect(actual).toEqual('');
    });

    it('returns "sub1.sub2." string for path "sub1/sub2/en.yaml"', () => {
      const actual = getPrefixKeyFromSourceFile('sub1/sub2/en.yaml');
      expect(actual).toEqual('sub1.sub2.');
    });

    it('returns "sub1.en.yaml." string for path "sub1/en.yaml/en.yaml"', () => {
      const actual = getPrefixKeyFromSourceFile('sub1/en.yaml/en.yaml');
      expect(actual).toEqual('sub1.en.yaml.');
    });
  });
  describe('removePrefix()', () => {
    it('returns empty string for both empty string', () => {
      const actual = removePrefix('', '');
      expect(actual).toEqual('');
    });

    it('returns same string for empty prefix', () => {
      const actual = removePrefix('', 'a.b.c');
      expect(actual).toEqual('a.b.c');
    });

    it('returns "k1.k2.k3" sourceFile="en.yaml" and id="k1.k2.k3" ', () => {
      const actual = removePrefix('en.yaml', 'k1.k2.k3');
      expect(actual).toEqual('k1.k2.k3');
    });

    it('returns "k1.k2.k3" sourceFile="./en.yaml" and id="k1.k2.k3" ', () => {
      const actual = removePrefix('./en.yaml', 'k1.k2.k3');
      expect(actual).toEqual('k1.k2.k3');
    });

    it('returns "k1.k2.k3" sourceFile="sub1/sub2/en.yaml" and id="sub1.sub2.k1.k2.k3"', () => {
      const actual = removePrefix('sub1/sub2/en.yaml', 'sub1.sub2.k1.k2.k3');
      expect(actual).toEqual('k1.k2.k3');
    });
  });
});
