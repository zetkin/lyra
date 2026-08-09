import React from 'react';
import { Box } from '@mui/material';
import { notFound } from 'next/navigation';

import Sidebar from '@/components/Sidebar';
import TitleBar from '@/components/TitleBar';
import MessageTree from '@/components/MessageTree';
import SidebarContextProvider from '@/components/SidebarContext';
import Header from '@/components/Header';
import Main from '@/components/Main';
import { accessLanguage } from '@/dataAccess';
import { info, toHex, warn } from '@/utils/log';

export const dynamic = 'force-dynamic';

export default async function WaitingLoopLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { languageName: string; messageId?: string; projectName: string };
}) {
  const { languageName, messageId, projectName } = params;

  const { messages } = (await accessLanguage(projectName, languageName)) || {};

  if (!messages?.length) {
    warn(
      `No message data found for project with code units ${toHex(projectName)}`,
    );
    return notFound();
  }

  info(
    `Found ${messages?.length} messages for language '${languageName}' in project '${projectName}'`,
  );

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
        </Sidebar>
      </SidebarContextProvider>
      <Main>{children}</Main>
    </Box>
  );
}
