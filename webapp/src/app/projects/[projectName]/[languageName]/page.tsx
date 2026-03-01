'use client';

import { NextPage } from 'next';
import React, { useCallback, useEffect, useState } from 'react';
import ErrorIcon from '@mui/icons-material/Error';
import { Box, CircularProgress, Typography } from '@mui/material';

import Sidebar from '@/components/Sidebar';
import TitleBar from '@/components/TitleBar';
import MessageList from '@/components/MessageList';
import MessageTree from '@/components/MessageTree';
import SidebarContextProvider from '@/components/SidebarContext';
import Header from '@/components/Header';
import Main from '@/components/Main';
import { ErrorDto } from '@/app/api/projects/[projectName]/languages/[languageId]/messages/route';
import { MessageDto } from '@/dto/MessageDto';

type MessagesState = {
  messageData: MessageDto[];
  status: 'ready' | 'not-found' | 'loading';
};

const MessagesPage: NextPage<{
  params: { languageName: string; messageId?: string; projectName: string };
}> = ({ params }) => {
  const { languageName, projectName } = params;

  const [messageId, setMessageId] = useState(params.messageId);
  const [messagesState, setMessagesState] = useState<MessagesState>({
    messageData: [],
    status: 'loading',
  });

  useEffect(() => {
    fetch(`/api/projects/${projectName}/languages/${languageName}/messages`)
      .then((r) => r.json())
      .then((l: MessageDto[] | ErrorDto) => {
        if (l satisfies ErrorDto) {
          setMessagesState({
            messageData: [],
            status: 'not-found',
          });
          return;
        }
        setMessagesState({
          messageData: l as MessageDto[],
          status: 'ready',
        });
      });
  }, [projectName, languageName]);

  const onItemSelectionToggle = useCallback(
    (_e: React.SyntheticEvent, id: string, isSelected: boolean) => {
      if (isSelected) {
        setMessageId(id);
        window.history.pushState(
          null,
          '',
          `/projects/${projectName}/${languageName}/${id}`,
        );
      }
    },
    [languageName, projectName],
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
          {messagesState.status === 'loading' && (
            <Box
              alignItems="center"
              display="flex"
              flexDirection="column"
              height="100%"
              justifyContent="center"
            >
              <CircularProgress />
            </Box>
          )}
          {messagesState.status === 'ready' && (
            <MessageTree
              messageId={messageId}
              messages={messagesState.messageData}
              onItemSelectionToggle={onItemSelectionToggle}
            />
          )}
        </Sidebar>
      </SidebarContextProvider>
      <Main>
        {messagesState.status === 'loading' && (
          <Box
            alignItems="center"
            display="flex"
            flexDirection="column"
            height="100%"
            justifyContent="center"
          >
            <CircularProgress />
          </Box>
        )}
        {messagesState.status === 'not-found' && (
          <Box
            alignItems="center"
            display="flex"
            flexDirection="column"
            height="100%"
            justifyContent="center"
          >
            <ErrorIcon />
            <Typography component="h1" fontWeight="bold">
              Not Found
            </Typography>
          </Box>
        )}
        {messagesState.status === 'ready' && (
          <MessageList
            language={languageName}
            messages={
              messageId
                ? messagesState.messageData.filter((m) =>
                    m.i18nKey.startsWith(messageId),
                  )
                : messagesState.messageData
            }
            projectName={projectName}
          />
        )}
      </Main>
    </Box>
  );
};

export default MessagesPage;
