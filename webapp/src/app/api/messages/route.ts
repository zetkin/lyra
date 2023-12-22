import { envVarNotFound } from '@/utils/util';
import LyraConfig from '@/utils/config';
import { LyraConfigReadingError } from '@/errors';
import MessageAdapterFactory from '@/utils/adapters/MessageAdapterFactory';
import { NextRequest, NextResponse } from 'next/server';

const REPO_PATH = process.env.REPO_PATH ?? envVarNotFound('REPO_PATH');

export async function GET(req: NextRequest) {
  try {
    const lyraConfig = await LyraConfig.readFromDir(REPO_PATH);
    const payload = await req.json();
    const projectConfig = payload.project
      ? lyraConfig.getProjectConfigByPath(payload.project)
      : lyraConfig.projects[0];
    const msgAdapter = MessageAdapterFactory.createAdapter(projectConfig);
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
