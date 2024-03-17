import { Cache } from '@/Cache';
import { LyraConfig } from '@/utils/lyraConfig';
import { RepoGit } from '@/RepoGit';
import { ServerConfig } from '@/utils/serverConfig';
import {
  LanguageNotFound,
  LanguageNotSupported,
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
  // TODO: include getProjectConfig & readFromDir in a try/catch block and check for error to return a certain 500 error
  const serverProjectConfig = await ServerConfig.getProjectConfig(projectName);
  await RepoGit.cloneIfNotExist(serverProjectConfig);
  const lyraConfig = await LyraConfig.readFromDir(serverProjectConfig.repoPath);

  try {
    const projectConfig = lyraConfig.getProjectConfigByPath(
      serverProjectConfig.projectPath,
    );
    if (!projectConfig.isLanguageSupported(lang)) {
      throw new LanguageNotSupported(lang, projectName);
    }
    const projectStore = await Cache.getProjectStore(projectConfig);
    await projectStore.updateTranslation(lang, msgId, text);
  } catch (e) {
    if (
      e instanceof LanguageNotFound ||
      e instanceof LanguageNotSupported ||
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
