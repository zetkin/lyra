'use server';

import { notFound } from 'next/navigation';

import { Cache } from '@/Cache';
import { RepoGit } from '@/RepoGit';
import { ServerConfig } from '@/utils/serverConfig';

export default async function updateTranslation(
  projectName: string,
  languageName: string,
  messageId: string,
  translation: string,
) {
  'use server';

  const serverConfig = await ServerConfig.read();
  const project = serverConfig.projects.find(
    (project) => project.name === projectName,
  );

  if (!project) {
    return notFound();
  }

  await RepoGit.cloneIfNotExist(project);
  const repoGit = await RepoGit.getRepoGit(project);
  const lyraConfig = await repoGit.getLyraConfig();
  const projectConfig = lyraConfig.getProjectConfigByPath(project.projectPath);

  if (!projectConfig.isLanguageSupported(languageName)) {
    return notFound();
  }

  const projectStore = await Cache.getProjectStore(projectConfig);
  await projectStore.updateTranslation(languageName, messageId, translation);
}
