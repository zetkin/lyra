import { RepoGit } from '@/RepoGit';
import { ServerConfig, ServerProjectConfig } from '@/utils/serverConfig';
import { getTranslationsIdText } from './utils/translationObjectUtil';
import { LanguageNotSupported } from './errors';
import { Store } from '@/store/Store';

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

  const repoGit = await RepoGit.get(project);
  const fetched = await repoGit.fetchAndCheckoutOriginBase();
  const lyraConfig = await repoGit.getLyraConfig();
  const projectConfig = lyraConfig.getProjectConfigByPath(project.projectPath);
  const projectStore = await Store.getProjectStore(projectConfig);
  if (fetched) {
    await projectStore.refresh();
  }
  const messages = await projectStore.getMessages();

  if (!projectConfig.isLanguageSupported(languageName)) {
    throw new LanguageNotSupported(languageName, projectName);
  }

  const translationsWithFilePath =
    await projectStore.getTranslations(languageName);

  const translations = getTranslationsIdText(translationsWithFilePath);

  return {
    messages,
    translations,
  };
}

async function readProject(project: ServerProjectConfig) {
  if (!(await RepoGit.cloneIfNotExist(project))) {
    return { languagesWithTranslations: [], messages: [], name: project.name };
  }
  const repoGit = await RepoGit.get(project);
  const fetched = await repoGit.fetchAndCheckoutOriginBase();
  const lyraConfig = await repoGit.getLyraConfig();
  const projectConfig = lyraConfig.getProjectConfigByPath(project.projectPath);
  const store = await Store.getProjectStore(projectConfig);
  if (fetched) {
    await store.refresh();
  }
  const messages = await store.getMessages();
  const languagesWithTranslations = projectConfig.languages.map(
    async (lang) => {
      const translations = await store.getTranslations(lang);
      return { lang, translations };
    },
  );
  return { languagesWithTranslations, messages, name: project.name };
}
