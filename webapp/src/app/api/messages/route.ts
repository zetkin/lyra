import { envVarNotFound } from '@/utils/util';
import fs from 'fs/promises';
import { NextResponse } from 'next/server';
import path from 'path';
import readTypedMessages, {
  MessageData,
} from '@/utils/readTypedMessages';

const REPO_PATH = process.env.REPO_PATH ?? envVarNotFound('REPO_PATH');

export async function GET() {
  const messages: MessageData[] = [];
  // TODO: read path or src from .lyra.yml setting file in client repo
  for await (const item of getMessageFiles(REPO_PATH + '/src')) {
    messages.push(...readTypedMessages(item));
  }

  // TODO: change data instruction to be a map of key to value, instead of object
  //       message id is the key, and value is an object with default and params
  //       example: { 'key1.key2.key3': { default: 'default text', params: [] }}
  return NextResponse.json({
    data: messages,
  });
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
