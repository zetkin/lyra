import { Cache } from '@/Cache';
import { LyraConfig } from '@/utils/LyraConfig';
import { ServerConfig } from '@/utils/ServerConfig';
import {
  LanguageNotFound,
  MessageNotFound,
  ProjectNameNotFoundError,
  ProjectPathNotFoundError,
} from '@/errors';
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
  const { lang, msgId, projectName } = context.params;
  const payload = await req.json();
  const { text } = payload;
  const serverProjectConfig = await ServerConfig.getProjectConfig(projectName);
  const lyraConfig = await LyraConfig.get(serverProjectConfig.localPath);
  const projectConfig = lyraConfig.getProjectConfigByPath(
    serverProjectConfig.subProjectPath,
  );

  try {
    const projectStore = await Cache.getProjectStore(
      serverProjectConfig.localPath,
      projectConfig,
    );
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