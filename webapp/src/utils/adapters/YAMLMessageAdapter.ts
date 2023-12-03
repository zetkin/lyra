import { MessageData } from '../readTypedMessages';
import path from 'path';
import fs from 'fs/promises';
import { parse } from 'yaml';
import flattenObject from '../flattenObject';

export default class YAMLMessageAdapter {
  private basePath: string;

  constructor(basePath: string = 'locale') {
    this.basePath = basePath;
  }

  async getMessages(): Promise<MessageData[]> {
    const messages: MessageData[] = [];

    for await (const absFileName of findYMLFiles(this.basePath)) {
      const numBaseElements = this.basePath.split('/').length;

      const fileName = path.relative('.', absFileName);
      const filePath = fileName.split('/').slice(numBaseElements, -1);
      const yamlBuffer = await fs.readFile(fileName);
      const payload = parse(yamlBuffer.toString());
      const flattened = flattenObject(payload);

      Object.keys(flattened).forEach((key) => {
        messages.push({
          id: [...filePath, key].join('.'),
          defaultMessage: flattened[key],
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
