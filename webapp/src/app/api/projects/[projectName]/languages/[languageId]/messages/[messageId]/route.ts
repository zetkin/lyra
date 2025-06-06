import { NextRequest, NextResponse } from 'next/server';

import { RepoGit } from '@/RepoGit';
import { ServerConfig } from '@/utils/serverConfig';
import { error, info } from '@/utils/log';
import { Store } from '@/store/Store';

export type TranslationSuccess = {
  translationStatus: 'success';
  translationText: string;
};

type TranslationError = {
  errorMessage: string;
  original: string;
  translationStatus: 'error';
  translationText: string;
};

type TranslationIdle = {
  translationStatus: 'idle';
  translationText: string;
};

type TranslationUpdating = {
  original: string;
  translationStatus: 'updating';
  translationText: string;
};

type TranslationModified = {
  original: string;
  translationStatus: 'modified';
  translationText: string;
};

export type TranslationState =
  | TranslationIdle
  | TranslationUpdating
  | TranslationSuccess
  | TranslationModified
  | TranslationError;

export async function POST(
  req: NextRequest,
  context: {
    params: { languageId: string; messageId: string; projectName: string };
  },
): Promise<NextResponse<TranslationState>> {
  const { languageId, messageId, projectName } = context.params;
  const { original, translation } = await req.json();

  const serverConfig = await ServerConfig.read();
  const project = serverConfig.projects.find(
    (project) => project.name === projectName,
  );

  if (!project) {
    return NextResponse.json({
      errorMessage: `Project not found: ${projectName}`,
      original,
      translationStatus: 'error',
      translationText: translation,
    });
  }

  const repoGit = await RepoGit.get(project);
  const lyraConfig = await repoGit.getLyraConfig();
  const projectConfig = lyraConfig.getProjectConfigByPath(project.projectPath);

  if (!projectConfig.isLanguageSupported(languageId)) {
    return NextResponse.json({
      errorMessage: `Language not supported: ${languageId}`,
      original,
      translationStatus: 'error',
      translationText: translation,
    });
  }

  const projectStore = await Store.getProjectStore(projectConfig);

  const messages = await projectStore.getMessages();
  const messageIds = messages.map((message) => message.id);
  const foundId = messageIds.find((id) => id == messageId);

  if (foundId === undefined) {
    return NextResponse.json({
      errorMessage: 'Message Id not found',
      original,
      translationStatus: 'error',
      translationText: translation,
    });
  }

  try {
    await projectStore.updateTranslation(languageId, messageId, translation);
    await Store.persistToDisk();
    info(`Updated '${languageId}' translation for '${messageId}'`);
  } catch (e) {
    error(`Failed to update translation: ${e}`);
    return NextResponse.json({
      errorMessage: 'Failed to update translation',
      original,
      translationStatus: 'error',
      translationText: translation,
    });
  }
  return NextResponse.json({
    translationStatus: 'success',
    translationText: translation,
  });
}
