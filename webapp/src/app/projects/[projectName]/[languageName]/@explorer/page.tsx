import { NextPage } from 'next';
import { notFound } from 'next/navigation';

import ExplorerTree from '@/components/ExplorerTree';
import MessageAdapterFactory from '@/utils/adapters/MessageAdapterFactory';
import { RepoGit } from '@/RepoGit';
import { ServerConfig } from '@/utils/serverConfig';

const Explorer: NextPage<{
  params: { languageName: string; messageId?: string; projectName: string };
}> = async ({ params }) => {
  const { languageName, projectName } = params;

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
  const msgAdapter = MessageAdapterFactory.createAdapter(projectConfig);
  const messages = await msgAdapter.getMessages();

  return (
    <ExplorerTree
      languageName={languageName}
      messages={messages}
      projectName={projectName}
    />
  );
};

export default Explorer;
