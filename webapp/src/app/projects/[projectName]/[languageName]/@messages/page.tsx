import { NextPage } from 'next';
import { notFound } from 'next/navigation';
import { Box, Typography } from '@mui/material';

import { Cache } from '@/Cache';
import { RepoGit } from '@/RepoGit';
import MessageAdapterFactory from '@/utils/adapters/MessageAdapterFactory';
import { ServerConfig } from '@/utils/serverConfig';
import MessageForm from '@/components/MessageForm';

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

const Messages: NextPage<{
  params: { languageName: string; messageId: string; projectName: string };
}> = async ({ params }) => {
  const { languageName, messageId, projectName } = params;

  if (!messageId) {
    return (
      <Box>
        <Typography component="h1">Messages</Typography>
        <Typography component="p">
          Please choose a message ID from the menu
        </Typography>
      </Box>
    );
  }

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

  return (
    <>
      {filteredMessages.map((message) => (
        <MessageForm
          key={message.id}
          languageName={languageName}
          message={message}
          projectName={projectName}
          saveTranslation={saveTranslation}
          translation={translations[message.id]}
        />
      ))}
    </>
  );
};

export default Messages;
