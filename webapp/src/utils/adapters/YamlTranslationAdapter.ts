import flattenObject from '../flattenObject';
import fs from 'fs/promises';
import { parse } from 'yaml';
import path from 'path';
import { type TranslationMap } from '.';

export default class YamlTranslationAdapter {
  private basePath: string;

  constructor(basePath: string) {
    this.basePath = basePath;
  }

  async getTranslations(): Promise<TranslationMap> {
    const matcher = (path: string) =>
      path.endsWith('.yml') || path.endsWith('.yaml');

    const map: TranslationMap = {};

    for await (const fullPath of findFiles(this.basePath, matcher)) {
      const sourceFilePath = path.relative(this.basePath, fullPath);
      const fileName = path.basename(fullPath);
      const pathWithoutFile = sourceFilePath.slice(0, -fileName.length);
      const yamlBuf = await fs.readFile(fullPath);
      const data = parse(yamlBuf.toString());
      const flattened = flattenObject(data);

      const lang = fileName.split('.')[0];
      if (!map[lang]) {
        map[lang] = {};
      }

      Object.entries(flattened).forEach(([key, value]) => {
        const elements = [
          ...pathWithoutFile.split('/'),
          ...key.split('.'),
        ].filter((elem) => !!elem);

        const id = elements.join('.');

        map[lang][id] = {
          sourceFile: sourceFilePath,
          text: value,
        };
      });
    }

    return map;
  }
}

async function* findFiles(
  dir: string,
  matches: (fullFilePath: string) => boolean
): AsyncIterable<string> {
  const dirEnts = await fs.readdir(dir, { withFileTypes: true });
  for (const dirEnt of dirEnts) {
    const fullFilePath = path.resolve(dir, dirEnt.name);
    if (dirEnt.isDirectory()) {
      yield* findFiles(fullFilePath, matches);
    } else if (matches(fullFilePath)) {
      yield fullFilePath;
    }
  }
}
