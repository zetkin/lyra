import { envVarNotFound } from '@/utils/util';
import { NextResponse } from 'next/server';
import MessageAdapterFactory from '@/utils/adapters/MessageAdapterFactory';
import LyraConfig from '@/utils/config';

const REPO_PATH = process.env.REPO_PATH ?? envVarNotFound('REPO_PATH');

export async function GET() {
  const config = await LyraConfig.readFromDir(REPO_PATH);
  const msgAdapter = MessageAdapterFactory.createAdapter(config);
  const messages = await msgAdapter.getMessages();

  return NextResponse.json({
    data: messages,
  });
}
