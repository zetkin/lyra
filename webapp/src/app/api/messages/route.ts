import { envVarNotFound } from '@/utils/util';
import LyraConfig from '@/utils/config';
import { LyraConfigReadingError } from '@/errors';
import MessageAdapterFactory from '@/utils/adapters/MessageAdapterFactory';
import { NextRequest, NextResponse } from 'next/server';

const REPO_PATH = process.env.REPO_PATH ?? envVarNotFound('REPO_PATH');

export async function GET(req: NextRequest) {
  try {
    const config = await LyraConfig.readFromDir(REPO_PATH);
    const body = await req.json();
    const findIndex = config.projects.findIndex(
      (it) => it.path === body?.project,
    );
    const index = findIndex === -1 ? 0 : findIndex;
    const msgAdapter = MessageAdapterFactory.createAdapter(
      config.projects[index],
    );
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
