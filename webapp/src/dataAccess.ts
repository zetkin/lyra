import { Cache } from '@/Cache';
import MessageAdapterFactory from '@/utils/adapters/MessageAdapterFactory';
import { RepoGit } from '@/RepoGit';
import { ServerConfig } from '@/utils/serverConfig';

export async function accessProjects() {
  const serverConfig = await ServerConfig.read();
  return serverConfig.projects.map(async (project) => {
    await RepoGit.cloneIfNotExist(project);
    const repoGit = await RepoGit.getRepoGit(project);
    const lyraConfig = await repoGit.getLyraConfig();
    const projectConfig = lyraConfig.getProjectConfigByPath(
      project.projectPath,
    );
    const msgAdapter = MessageAdapterFactory.createAdapter(projectConfig);
    const messages = await msgAdapter.getMessages();
    const store = await Cache.getProjectStore(projectConfig);
    const languagesWithTranslations = projectConfig.languages.map(
      async (lang) => {
        const translations = await store.getTranslations(lang);
        return { lang, translations };
      },
    );
    return { languagesWithTranslations, messages, name: project.name };
  });
}
