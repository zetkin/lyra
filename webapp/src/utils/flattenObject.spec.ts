import flattenObject from './flattenObject';
import { describe, expect, it } from '@jest/globals';

describe('flattenObject()', () => {
  it('returns empty object for empty obj', () => {
    const actual = flattenObject({});
    expect(actual).toEqual({});
  });
  it('flatten obj one string property', () => {
    const actual = flattenObject({ a: 'b' });
    expect(actual).toEqual({ a: 'b' });
  });
  it('flatten simple obj one object property', () => {
    const actual = flattenObject({ a: { b: { c: 'd' } } });
    const expected = { 'a.b.c': 'd' };
    expect(actual).toEqual(expected);
  });
  it('flatten two properties obj', () => {
    const actual = flattenObject({
      a: {
        b: {
          c: 'd',
          e: 'f',
        },
      },
    });
    const expected = {
      'a.b.c': 'd',
      'a.b.e': 'f',
    };
    expect(actual).toEqual(expected);
  });
  it('flatten four properties obj', () => {
    const actual = flattenObject({
      a: {
        b: {
          c: 'v1',
          e: 'v4.xx.x',
        },
      },
      f: {
        g: 'v2',
      },
      k: 'v3',
    });
    const expected = {
      'a.b.c': 'v1',
      'a.b.e': 'v4.xx.x',
      'f.g': 'v2',
      k: 'v3',
    };
    expect(actual).toEqual(expected);
  });
  it('flatten properties string and obj', () => {
    const actual = {
      'a.b.c': 'd',
      e: 'f',
    };
    const expected = flattenObject({
      a: {
        b: {
          c: 'd',
        },
      },
      e: 'f',
    });
    expect(actual).toEqual(expected);
  });
});
