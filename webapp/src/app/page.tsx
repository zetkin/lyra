import { Cache } from '@/Cache';
import MessageAdapterFactory from '@/utils/adapters/MessageAdapterFactory';
import { ProjectCardProps } from '@/components/ProjectCard';
import ProjectsDashboard from '@/components/ProjectsDashboard';
import { RepoGit } from '@/RepoGit';
import { ServerConfig } from '@/utils/serverConfig';

export default async function Home() {
  const serverConfig = await ServerConfig.read();
  const projects = await Promise.all(
    serverConfig.projects.map<Promise<ProjectCardProps>>(async (project) => {
      await RepoGit.cloneIfNotExist(project);
      const repoGit = await RepoGit.getRepoGit(project);
      const lyraConfig = await repoGit.getLyraConfig();
      const projectConfig = lyraConfig.getProjectConfigByPath(
        project.projectPath,
      );
      const msgAdapter = MessageAdapterFactory.createAdapter(projectConfig);
      const messages = await msgAdapter.getMessages();
      const store = await Cache.getProjectStore(projectConfig);
      const languages = await Promise.all(
        projectConfig.languages.map(async (lang) => {
          const translations = await store.getTranslations(lang);
          return {
            href: `/projects/${project.name}/${lang}`,
            language: lang,
            progress: translations
              ? (Object.keys(translations).length / messages.length) * 100
              : 0,
          };
        }),
      );

      return {
        href: `/projects/${project.name}`,
        languages,
        messageCount: messages.length,
        name: project.name,
      };
    }),
  );

  return <ProjectsDashboard projects={projects} />;
}
