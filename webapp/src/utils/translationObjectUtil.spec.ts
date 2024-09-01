import { describe, expect, it } from '@jest/globals';

import {
  getTranslationsIdText,
  getTranslationsBySourceFile,
} from './translationObjectUtil';

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
  describe('getTranslationsBySourceFile()', () => {
    it('returns empty object for empty obj', () => {
      const actual = getTranslationsBySourceFile({});
      expect(actual).toEqual({});
    });
    it('group by sourceFile obj one property', () => {
      const actual = getTranslationsBySourceFile({
        a: { sourceFile: 'en.yaml', text: 'A' },
      });
      expect(actual).toEqual({ 'en.yaml': { a: 'A' } });
    });
    it('group by sourceFile simple obj one object property', () => {
      const actual = getTranslationsBySourceFile({
        'a.b.c': { sourceFile: 'en.yaml', text: 'ABC' },
      });
      expect(actual).toEqual({ 'en.yaml': { 'a.b.c': 'ABC' } });
    });
    it('group by sourceFile two properties obj', () => {
      const actual = getTranslationsBySourceFile({
        'a.b.c': { sourceFile: 'f1/en.yaml', text: 'ABC' },
        'a.b.e': { sourceFile: 'f2/en.yml', text: 'ABE' },
      });
      const expected = {
        'f1/en.yaml': { 'a.b.c': 'ABC' },
        'f2/en.yml': { 'a.b.e': 'ABE' },
      };
      expect(actual).toEqual(expected);
    });
    it('group by sourceFile two sourceFiles obj', () => {
      const actual = getTranslationsBySourceFile({
        'a.b.c': { sourceFile: 'f1/en.yaml', text: 'ABC' },
        'a.b.e': { sourceFile: 'f1/en.yaml', text: 'ABE' },
        'a.b.f': { sourceFile: 'f2/en.yml', text: 'ABF' },
      });
      const expected = {
        'f1/en.yaml': { 'a.b.c': 'ABC', 'a.b.e': 'ABE' },
        'f2/en.yml': { 'a.b.f': 'ABF' },
      };
      expect(actual).toEqual(expected);
    });
  });
});
