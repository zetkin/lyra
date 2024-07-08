import { Box } from '@mui/material';
import { NextPage } from 'next';
import { notFound } from 'next/navigation';

import Header from '@/components/Header';
import Main from '@/components/Main';
import Sidebar from '@/components/Sidebar';
import { Cache } from '@/Cache';
import MessageAdapterFactory from '@/utils/adapters/MessageAdapterFactory';
import { RepoGit } from '@/RepoGit';
import { ServerConfig } from '@/utils/serverConfig';
import MessageTree from '@/components/MessageTree';
import MessageList from '@/components/MessageList';

async function saveTranslation(
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
    return;
  }
  await RepoGit.cloneIfNotExist(project);
  const repoGit = await RepoGit.getRepoGit(project);
  const lyraConfig = await repoGit.getLyraConfig();
  const projectConfig = lyraConfig.getProjectConfigByPath(project.projectPath);
  if (!projectConfig.isLanguageSupported(languageName)) {
    return;
  }
  const projectStore = await Cache.getProjectStore(projectConfig);
  await projectStore.updateTranslation(languageName, messageId, translation);
}

const MessagesPage: NextPage<{
  params: { languageName: string; messageId?: string; projectName: string };
}> = async ({ params }) => {
  const { languageName, messageId, projectName } = params;

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
  const translations = await Cache.getLanguage(projectName, languageName);

  const prefix = messageId ? messageId : '';
  const filteredMessages = messages.filter((message) =>
    message.id.startsWith(prefix),
  );
  filteredMessages.sort((m0, m1) => {
    const trans0 = translations[m0.id]?.trim() ?? '';
    const trans1 = translations[m1.id]?.trim() ?? '';

    if (!trans0) {
      return -1;
    } else if (trans1) {
      return 1;
    } else {
      return 0;
    }
  });

  return (
    <Box sx={{ display: 'flex', minHeight: '100dvh' }}>
      <Header />
      <Sidebar>
        <MessageTree
          languageName={languageName}
          messageId={messageId}
          messages={messages}
          projectName={projectName}
        />
      </Sidebar>
      <Main>
        <MessageList
          languageName={languageName}
          messages={filteredMessages}
          projectName={projectName}
          saveTranslation={saveTranslation}
          translations={translations}
        />
      </Main>
    </Box>
  );
};

export default MessagesPage;
