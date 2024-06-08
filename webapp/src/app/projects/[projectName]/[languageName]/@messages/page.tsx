import MessageAdapterFactory from '@/utils/adapters/MessageAdapterFactory';
import { NextPage } from 'next';
import { notFound } from 'next/navigation';
import { RepoGit } from '@/RepoGit';
import { ServerConfig } from '@/utils/serverConfig';
import { Box, Typography } from '@mui/joy';

const Messages: NextPage<{
  params: { languageName: string; messageId: string; projectName: string };
}> = async ({ params }) => {
  const { languageName, projectName, messageId } = params;
  console.log(languageName);

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

  const prefix = messageId ? messageId : '';
  const filteredMessages = messages.filter((message) =>
    message.id.startsWith(prefix),
  );

  return (
    <>
      {filteredMessages.map((message) => (
        <div key={message.id}>{message.id}</div>
      ))}
    </>
  );
};

export default Messages;
