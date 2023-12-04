import { envVarNotFound } from '@/utils/util';
import LyraConfig from '@/utils/config';
import MessageAdapterFactory from '@/utils/adapters/MessageAdapterFactory';
import { NextResponse } from 'next/server';

const REPO_PATH = process.env.REPO_PATH ?? envVarNotFound('REPO_PATH');

export async function GET() {
  const config = await LyraConfig.readFromDir(REPO_PATH);
  const msgAdapter = MessageAdapterFactory.createAdapter(config);
  const messages = await msgAdapter.getMessages();

  // TODO: change data instruction to be a map of key to value, instead of object
  //       message id is the key, and value is an object with default and params
  //       example: { 'key1.key2.key3': { default: 'default text', params: [] }}
  return NextResponse.json({
    data: messages,
  });
}
