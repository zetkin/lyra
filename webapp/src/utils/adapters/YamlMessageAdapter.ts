import flattenObject from '../flattenObject';
import fs from 'fs/promises';
import { parse } from 'yaml';
import path from 'path';
import { IMessageAdapter, type MessageData } from '.';

export default class YAMLMessageAdapter implements IMessageAdapter {
  private basePath: string;

  constructor(basePath: string = 'locale') {
    this.basePath = basePath;
  }

  async getMessages(): Promise<MessageData[]> {
    const messages: MessageData[] = [];

    for await (const absFileName of findYMLFiles(this.basePath)) {
      const fileNameRelativeToBase = path.relative(this.basePath, absFileName);
      const prefixPath = fileNameRelativeToBase.split('/').slice(0, -1);

      const yamlBuffer = await fs.readFile(absFileName);
      const payload = parse(yamlBuffer.toString());
      const flattened = flattenObject(payload);

      Object.keys(flattened).forEach((key) => {
        messages.push({
          defaultMessage: flattened[key],
          id: [...prefixPath, key].join('.'),
          params: [],
        });
      });
    }

    return messages;
  }
}

async function* findYMLFiles(dir: string): AsyncIterable<string> {
  const dirEnts = await fs.readdir(dir, { withFileTypes: true });
  for (const dirEnt of dirEnts) {
    const fullFilePath = path.resolve(dir, dirEnt.name);
    if (dirEnt.isDirectory()) {
      yield* findYMLFiles(fullFilePath);
    } else if (
      fullFilePath.endsWith('en.yml') ||
      fullFilePath.endsWith('en.yaml')
    ) {
      yield fullFilePath;
    }
  }
}
