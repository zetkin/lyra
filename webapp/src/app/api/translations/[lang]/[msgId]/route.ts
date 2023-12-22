import { Cache } from '@/Cache';
import { envVarNotFound } from '@/utils/util';
import LyraConfig from '@/utils/config';
import { LanguageNotFound, MessageNotFound } from '@/errors';
import { NextRequest, NextResponse } from 'next/server';

const REPO_PATH = process.env.REPO_PATH ?? envVarNotFound('REPO_PATH');

export async function PUT(
  req: NextRequest,
  context: {
    params: {
      lang: string;
      msgId: string;
    };
  },
) {
  const payload = await req.json();
  const { lang, msgId } = context.params;
  const { text, project } = payload;
  const lyraConfig = await LyraConfig.readFromDir(REPO_PATH);
  const projectConfig = project
    ? lyraConfig.getProjectConfigByPath(project)
    : lyraConfig.projects[0];

  try {
    const projectStore = await Cache.getProjectStore(projectConfig.path);
    await projectStore.updateTranslation(lang, msgId, text);
  } catch (e) {
    if (e instanceof LanguageNotFound || e instanceof MessageNotFound) {
      return NextResponse.json({ message: e.message }, { status: 404 });
    }
    throw e;
  }

  return NextResponse.json({
    lang,
    msgId,
    text,
  });
}
