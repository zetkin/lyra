import { Cache } from '@/Cache';
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
      languageName: string;
      messageId: string;
      projectName: string;
    };
  },
) {
  const { languageName, messageId, projectName } = context.params;
  const payload = await req.json();
  const { text } = payload;
  // TODO: include getProjectConfig() and getLyraConfig() in a try/catch block and check for error to return a certain 500 error
  const serverProjectConfig = await ServerConfig.getProjectConfig(projectName);
  await RepoGit.cloneIfNotExist(serverProjectConfig);
  const repoGit = await RepoGit.getRepoGit(serverProjectConfig);
  const lyraConfig = await repoGit.getLyraConfig();

  try {
    const projectConfig = lyraConfig.getProjectConfigByPath(
      serverProjectConfig.projectPath,
    );
    if (!projectConfig.isLanguageSupported(languageName)) {
      throw new LanguageNotSupported(languageName, projectName);
    }
    const projectStore = await Cache.getProjectStore(projectConfig);
    await projectStore.updateTranslation(languageName, messageId, text);
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
    languageName,
    messageId,
    projectName,
  });
}
