import { unflattenObject } from './unflattenObject';
import { describe, expect, it } from '@jest/globals';

describe('unflattenObject()', () => {
  it('unflat simple obj', () => {
    const actual = unflattenObject({ 'a.b.c': 'd' });
    expect(actual).toEqual({ a: { b: { c: 'd' } } });
  });
  it('unflat simple two properties obj', () => {
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
  it.todo('throw error or return empty object for empty obj');
  it.todo('throw error for invalid obj like property with number or symbol');
});
