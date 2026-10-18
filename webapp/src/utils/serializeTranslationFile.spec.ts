import { describe, expect, it } from '@jest/globals';

import serializeTranslationFile from './serializeTranslationFile';

describe('serializeTranslationFile()', () => {
  it('serializes to YAML for a .yml path', () => {
    const output = serializeTranslationFile({ no: 'Nein' }, 'locale/de.yml');

    expect(output).toEqual('no: Nein\n');
  });

  it('serializes to YAML for a .yaml path', () => {
    const output = serializeTranslationFile({ no: 'Nein' }, 'locale/de.yaml');

    expect(output).toEqual('no: Nein\n');
  });

  it('serializes to JSON for a .json path', () => {
    const output = serializeTranslationFile({ no: 'Nein' }, 'locale/de.json');

    expect(JSON.parse(output)).toEqual({ no: 'Nein' });
  });

  it('serializes nested objects to JSON', () => {
    const output = serializeTranslationFile(
      { options: { no: 'Nein' } },
      'locale/de.json',
    );

    expect(JSON.parse(output)).toEqual({ options: { no: 'Nein' } });
  });
});
