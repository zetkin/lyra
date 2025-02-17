'use server';

import { RepoGit } from '@/RepoGit';
import { Store } from '@/store/Store';
import { ServerConfig } from '@/utils/serverConfig';

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

export default async function updateTranslation(
  projectName: string,
  languageName: string,
  messageId: string,
  translation: string,
  original: string,
): Promise<TranslationState> {
  'use server';

  const serverConfig = await ServerConfig.read();
  const project = serverConfig.projects.find(
    (project) => project.name === projectName,
  );

  if (!project) {
    return {
      errorMessage: `Project not found: ${projectName}`,
      original,
      translationStatus: 'error',
      translationText: translation,
    };
  }

  await RepoGit.cloneIfNotExist(project);
  const repoGit = await RepoGit.getRepoGit(project);
  const lyraConfig = await repoGit.getLyraConfig();
  const projectConfig = lyraConfig.getProjectConfigByPath(project.projectPath);

  if (!projectConfig.isLanguageSupported(languageName)) {
    return {
      errorMessage: `Language not supported: ${languageName}`,
      original,
      translationStatus: 'error',
      translationText: translation,
    };
  }

  const projectStore = await Store.getProjectStore(projectConfig);

  const messages = await projectStore.getMessages();
  const messageIds = messages.map((message) => message.id);
  const foundId = messageIds.find((id) => id == messageId);

  if (foundId === undefined) {
    return {
      errorMessage: 'Message Id not found',
      original,
      translationStatus: 'error',
      translationText: translation,
    };
  }

  try {
    await projectStore.updateTranslation(languageName, messageId, translation);
    await Store.persistToDisk();
  } catch (e) {
    return {
      errorMessage: 'Failed to update translation',
      original,
      translationStatus: 'error',
      translationText: translation,
    };
  }
  return { translationStatus: 'success', translationText: translation };
}
