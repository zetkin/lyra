import readTypedMessages from '../readTypedMessages';
import fs from 'fs/promises';
import path from 'path';
import { MessageData } from '.';

export default class TSMessageAdapter {
  private basePath: string;

  constructor(basePath: string = 'src') {
    this.basePath = basePath;
  }

  async getMessages(): Promise<MessageData[]> {
    const messages: MessageData[] = [];
    for await (const item of getMessageFiles(this.basePath)) {
      messages.push(...readTypedMessages(item));
    }

    return messages;
  }
}

async function* getMessageFiles(dirPath: string): AsyncGenerator<string> {
  const items = await fs.readdir(dirPath);
  for (const item of items) {
    const itemPath = path.join(dirPath, item);
    const stats = await fs.stat(itemPath);
    if (stats.isDirectory()) {
      yield* getMessageFiles(itemPath);
    } else if (itemPath.endsWith('messageIds.ts')) {
      yield itemPath;
    }
  }
}
