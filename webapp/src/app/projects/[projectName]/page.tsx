import { NextPage } from 'next';
import { notFound } from 'next/navigation';

import { Cache } from '@/Cache';
import MessageAdapterFactory from '@/utils/adapters/MessageAdapterFactory';
import ProjectDashboard from '@/components/ProjectDashboard';
import { RepoGit } from '@/RepoGit';
import { ServerConfig } from '@/utils/serverConfig';

const ProjectPage: NextPage<{
  params: { projectName: string };
}> = async ({ params }) => {
  const serverConfig = await ServerConfig.read();
  const project = serverConfig.projects.find(
    (project) => project.name === params.projectName,
  );

  if (!project) {
    return notFound();
  }

  await RepoGit.cloneIfNotExist(project);
  const repoGit = await RepoGit.getRepoGit(project);
  const lyraConfig = await repoGit.getLyraConfig();
  const projectConfig = lyraConfig.getProjectConfigByPath(project.projectPath);
  const msgAdapter = MessageAdapterFactory.createAdapter(projectConfig);
  const messages = await msgAdapter.getMessages();
  const store = await Cache.getProjectStore(projectConfig);
  const languages = await Promise.all(
    projectConfig.languages.map(async (lang) => {
      const translations = await store.getTranslations(lang);
      return {
        href: `/projects/${project.name}/${lang}`,
        language: lang,
        messagesLeft: messages.length - Object.keys(translations).length,
        progress: translations
          ? (Object.keys(translations).length / messages.length) * 100
          : 0,
      };
    }),
  );

  return (
    <ProjectDashboard
      languages={languages}
      messageCount={messages.length}
      project={project.name}
    />
  );
};

export default ProjectPage;
