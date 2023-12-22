import { Cache } from '@/Cache';
import {
  LanguageNotFound,
  MessageNotFound,
  ProjectNameNotFoundError,
  ProjectPathNotFoundError,
} from '@/errors';
import { LyraConfig, ServerConfig } from '@/utils/config';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(
  req: NextRequest,
  context: {
    params: {
      lang: string;
      msgId: string;
      projectName: string;
    };
  },
) {
  const payload = await req.json();
  const { lang, msgId } = context.params;
  const { text } = payload;
  const projectName = context.params.projectName;
  const serverConfig = await ServerConfig.read();
  const serverProjectConfig = serverConfig.getProjectConfigByName(projectName);
  const lyraConfig = await LyraConfig.readFromDir(
    serverProjectConfig.localPath,
  );
  const projectConfig = lyraConfig.getProjectConfigByPath(
    serverProjectConfig.subProjectPath,
  );

  try {
    const projectStore = await Cache.getProjectStore(projectConfig.path);
    await projectStore.updateTranslation(lang, msgId, text);
  } catch (e) {
    if (
      e instanceof LanguageNotFound ||
      e instanceof MessageNotFound ||
      e instanceof ProjectNameNotFoundError ||
      e instanceof ProjectPathNotFoundError
    ) {
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
