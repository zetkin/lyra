import { Cache } from '@/Cache';
import { RepoGit } from '@/RepoGit';
import { ServerConfig, ServerProjectConfig } from '@/utils/serverConfig';
import { getTranslationsIdText } from './utils/translationObjectUtil';

export async function accessProjects() {
  const serverConfig = await ServerConfig.read();
  return serverConfig.projects.map(async (project) => {
    return await readProject(project);
  });
}

export async function accessProject(name: string) {
  const serverConfig = await ServerConfig.read();
  const project = serverConfig.projects.find(
    (project) => project.name === name,
  );

  if (!project) {
    return null;
  }

  return readProject(project);
}

export async function accessLanguage(
  projectName: string,
  languageName: string,
) {
  const serverConfig = await ServerConfig.read();
  const project = serverConfig.projects.find(
    (project) => project.name === projectName,
  );

  if (!project) {
    return null;
  }

  await RepoGit.cloneIfNotExist(project);
  const repoGit = await RepoGit.getRepoGit(project);
  await repoGit.checkoutBaseAndPull();
  const lyraConfig = await repoGit.getLyraConfig();
  const projectConfig = lyraConfig.getProjectConfigByPath(project.projectPath);
  const projectStore = await Cache.getProjectStore(projectConfig);
  const messages = await projectStore.getMessages();
  const translationsWithFilePath = await Cache.getLanguage(
    projectName,
    languageName,
  );
  const translations = getTranslationsIdText(translationsWithFilePath);

  return {
    messages,
    translations,
  };
}

async function readProject(project: ServerProjectConfig) {
  await RepoGit.cloneIfNotExist(project);
  const repoGit = await RepoGit.getRepoGit(project);
  await repoGit.checkoutBaseAndPull();
  const lyraConfig = await repoGit.getLyraConfig();
  const projectConfig = lyraConfig.getProjectConfigByPath(project.projectPath);
  const store = await Cache.getProjectStore(projectConfig);
  const messages = await store.getMessages();
  const languagesWithTranslations = projectConfig.languages.map(
    async (lang) => {
      const translations = await store.getTranslations(lang);
      return { lang, translations };
    },
  );
  return { languagesWithTranslations, messages, name: project.name };
}
