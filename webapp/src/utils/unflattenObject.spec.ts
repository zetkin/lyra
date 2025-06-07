import { describe, expect, it } from '@jest/globals';

import { unflattenObject } from './unflattenObject';

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
    const expected = {
      a: {
        b: {
          c: 'd',
          e: 'f',
        },
      },
    };
    expect(actual).toEqual(expected);
  });

  it('unflat four properties obj', () => {
    const actual = unflattenObject({
      'a.b.c': 'v1',
      'f.g': 'v2',
      k: 'v3',
      // eslint-disable-next-line sort-keys -- so we can test if object were not sorted
      'a.b.e': 'v4.xx.x',
    });
    const expected = {
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
    };
    expect(actual).toEqual(expected);
  });

  it('unflat properties string and obj', () => {
    const actual = unflattenObject({
      'a.b.c': 'd',
      e: 'f',
    });
    const expected = {
      a: {
        b: {
          c: 'd',
        },
      },
      e: 'f',
    };
    expect(actual).toEqual(expected);
  });
});
