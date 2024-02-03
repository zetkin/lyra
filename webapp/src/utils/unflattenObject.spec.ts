import { unflattenObject } from './unflattenObject';
import { describe, expect, it } from '@jest/globals';

describe('unflattenObject()', () => {
  it('returns empty object for empty obj', () => {
    const actual = unflattenObject({});
    expect(actual).toEqual({});
  });
  it('unflat obj one string property', () => {
    const actual = unflattenObject({ a: 'b' });
    expect(actual).toEqual({ a: 'b' });
  });
  it('unflat simple obj one object property', () => {
    const actual = unflattenObject({ 'a.b.c': 'd' });
    expect(actual).toEqual({ a: { b: { c: 'd' } } });
  });
  it('unflat two properties obj', () => {
    const actual = unflattenObject({
      'a.b.c': 'd',
      'a.b.e': 'f',
    });
    expect(actual).toEqual({
      a: {
        b: {
          c: 'd',
          e: 'f',
        },
      },
    });
  });
  it('unflat properties string and obj', () => {
    const actual = unflattenObject({
      'a.b.c': 'd',
      e: 'f',
    });
    expect(actual).toEqual({
      a: {
        b: {
          c: 'd',
        },
      },
      e: 'f',
    });
  });
});
