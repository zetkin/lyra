'use client';

import { NextPage } from 'next';
import React, { useEffect, useState } from 'react';
import ErrorIcon from '@mui/icons-material/Error';
import { Box, CircularProgress, Typography } from '@mui/material';

import Sidebar from '@/components/Sidebar';
import TitleBar from '@/components/TitleBar';
import MessageList from '@/components/MessageList';
import MessageTree from '@/components/MessageTree';
import SidebarContextProvider from '@/components/SidebarContext';
import Header from '@/components/Header';
import Main from '@/components/Main';
import { LanguageResponse } from '@/app/api/projects/[projectName]/languages/[languageId]/messages/route';

type LanguageLoadingState = {
  language: undefined;
  status: 'loading';
};

type LanguageNotFoundState = {
  language: undefined;
  status: 'not-found';
};

type LanguageReadyState = {
  language: LanguageResponse;
  status: 'ready';
};

type LanguageState =
  | LanguageLoadingState
  | LanguageNotFoundState
  | LanguageReadyState;

const MessagesPage: NextPage<{
  params: { languageName: string; messageId?: string; projectName: string };
}> = ({ params }) => {
  const { languageName, messageId, projectName } = params;

  const [state, setLanguageState] = useState<LanguageState>({
    language: undefined,
    status: 'loading',
  });

  useEffect(() => {
    const params = new URLSearchParams();
    if (messageId) {
      params.append('messageId', messageId);
    }
    fetch(
      `/api/projects/${projectName}/languages/${languageName}/messages?${params}`,
    )
      .then((r) => r.json())
      .then((l) => {
        if (l.errorMessage) {
          setLanguageState({
            language: undefined,
            status: 'not-found',
          });
          return;
        }
        setLanguageState({
          language: l,
          status: 'ready',
        });
      });
  }, [projectName, languageName, messageId]);

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
          {state.status === 'loading' && (
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
          {state.status === 'ready' && (
            <MessageTree
              languageName={languageName}
              messageId={messageId}
              messages={state.language.messages}
              projectName={projectName}
            />
          )}
        </Sidebar>
      </SidebarContextProvider>
      <Main>
        {state.status === 'loading' && (
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
        {state.status === 'not-found' && (
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
        {state.status === 'ready' && (
          <MessageList
            languageName={languageName}
            messages={state.language.messages}
            projectName={projectName}
            translations={state.language.translations}
          />
        )}
      </Main>
    </Box>
  );
};

export default MessagesPage;
