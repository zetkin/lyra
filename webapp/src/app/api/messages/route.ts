import { envVarNotFound } from '@/utils/util';
import LyraConfig from '@/utils/config';
import { LyraConfigReadingError } from '@/errors';
import MessageAdapterFactory from '@/utils/adapters/MessageAdapterFactory';
import { NextResponse } from 'next/server';

const REPO_PATH = process.env.REPO_PATH ?? envVarNotFound('REPO_PATH');

export async function GET() {
  try {
    const config = await LyraConfig.readFromDir(REPO_PATH);
    // TODO: make it multi projects
    const msgAdapter = MessageAdapterFactory.createAdapter(config.projects[0]);
    const messages = await msgAdapter.getMessages();

    return NextResponse.json({
      data: messages,
    });
  } catch (e) {
    if (e instanceof LyraConfigReadingError) {
      return getResponse500('error while reading lyra config');
    }
    return getResponse500('error reading messages error');
  }
}

function getResponse500(message: string): NextResponse {
  return NextResponse.json({ message }, { status: 500 });
}
