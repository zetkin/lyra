import { Box } from '@mui/material';
import { NextPage } from 'next';
import { notFound } from 'next/navigation';

import Header from '@/components/Header';
import Main from '@/components/Main';
import Sidebar from '@/components/Sidebar';
import MessageTree from '@/components/MessageTree';
import MessageList from '@/components/MessageList';
import PullRequestButton from '@/components/PullRequestButton';
import TitleBar from '@/components/TitleBar';
import SidebarContextProvider from '@/components/SidebarContext';
import { accessLanguage } from '@/dataAccess';

const MessagesPage: NextPage<{
  params: { languageName: string; messageId?: string; projectName: string };
}> = async ({ params }) => {
  const { languageName, messageId, projectName } = params;

  const languageData = await accessLanguage(projectName, languageName);
  if (!languageData) {
    return notFound();
  }

  const { messages, translations } = languageData;

  const prefix = messageId ? messageId : '';
  const filteredMessages = messages.filter((message) =>
    message.id.startsWith(prefix),
  );

  if (filteredMessages.length === 0) {
    return notFound();
  }

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
      <SidebarContextProvider>
        <Header
          languageName={languageName}
          messageId={messageId}
          projectName={projectName}
        />
        <Sidebar>
          <TitleBar languageName={languageName} projectName={projectName} />
          <MessageTree
            languageName={languageName}
            messageId={messageId}
            messages={messages}
            projectName={projectName}
          />
          <PullRequestButton projectName={projectName} />
        </Sidebar>
      </SidebarContextProvider>
      <Main>
        <MessageList
          languageName={languageName}
          messages={filteredMessages}
          projectName={projectName}
          translations={translations}
        />
      </Main>
    </Box>
  );
};

export default MessagesPage;
