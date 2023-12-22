import { Cache } from '@/Cache';
import { envVarNotFound } from '@/utils/util';
import { LanguageNotFound } from '@/errors';
import { LyraConfig } from '@/utils/config';
import { NextRequest, NextResponse } from 'next/server';

const REPO_PATH = process.env.REPO_PATH ?? envVarNotFound('REPO_PATH');

export async function GET(
  req: NextRequest, // keep this here even if unused
  context: { params: { lang: string; msgId: string } },
) {
  const lang = context.params.lang;
  try {
    const lyraConfig = await LyraConfig.readFromDir(REPO_PATH);
    const payload = await req.json();
    const projectConfig = payload.project
      ? lyraConfig.getProjectConfigByPath(payload.project)
      : lyraConfig.projects[0];

    const translations = await Cache.getLanguage(projectConfig.path, lang);
    return NextResponse.json({
      lang,
      translations,
    });
  } catch (e) {
    if (e instanceof LanguageNotFound) {
      return NextResponse.json(
        { message: 'language [' + lang + '] not found' },
        { status: 404 },
      );
    }
    throw e;
  }
}
