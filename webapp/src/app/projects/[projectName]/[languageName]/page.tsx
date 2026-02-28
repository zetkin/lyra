'use client';

import { NextPage } from 'next';
import { useSearchParams } from 'next/navigation';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ErrorIcon from '@mui/icons-material/Error';
import ListIcon from '@mui/icons-material/List';
import SearchIcon from '@mui/icons-material/Search';
import {
  Box,
  CircularProgress,
  Tab,
  TextField,
  Typography,
} from '@mui/material';
import { TabContext, TabList, TabPanel } from '@mui/lab';

import Breadcrumbs from '@/components/Breadcrumbs';
import Sidebar from '@/components/Sidebar';
import TitleBar from '@/components/TitleBar';
import MessageList from '@/components/MessageList';
import MessageTree from '@/components/MessageTree';
import SidebarContextProvider from '@/components/SidebarContext';
import Header from '@/components/Header';
import Main from '@/components/Main';
import { LanguageResponse } from '@/app/api/projects/[projectName]/languages/[languageId]/messages/route';
import SearchContextProvider, { SearchState } from '@/components/SearchContext';
import { textIncludesQuery } from '@/utils/search';

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

type TabId = 'tree' | 'find';

const MessagesPage: NextPage<{
  params: { languageName: string; messageId?: string; projectName: string };
}> = ({ params }) => {
  const { languageName, projectName } = params;

  const [messageId, setMessageId] = useState(params.messageId);
  const [languageState, setLanguageState] = useState<LanguageState>({
    language: undefined,
    status: 'loading',
  });
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('query');
  const [tab, setTab] = useState<TabId>(initialQuery ? 'find' : 'tree');
  const [searchState, setSearchState] = useState<SearchState>(
    initialQuery
      ? {
          query: initialQuery,
          status: 'busy',
        }
      : {
          query: '',
          status: 'idle',
        },
  );

  useEffect(() => {
    fetch(`/api/projects/${projectName}/languages/${languageName}/messages`)
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
  }, [projectName, languageName]);

  const onChangeTab = useCallback((_e: React.SyntheticEvent, newTab: TabId) => {
    if (newTab !== 'find') {
      window.history.pushState(null, '', window.location.pathname);
    }
    if (newTab === 'find') {
      setSearchState({ query: '', status: 'idle' });
    }
    setTab(newTab);
  }, []);

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

  const onChangeSearchQuery = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (event.target.value === '') {
        setSearchState({
          query: '',
          status: 'idle',
        });
        window.history.pushState(null, '', window.location.pathname);
      } else {
        setSearchState({
          query: event.target.value,
          status: 'busy',
        });
        const params = new URLSearchParams();
        params.set('query', event.target.value);
        const path = ['projects', projectName, languageName];
        if (messageId) {
          path.push(messageId);
        }
        window.history.pushState(null, '', `/${path.join('/')}?${params}`);
      }
    },
    [languageName, messageId, projectName],
  );

  const messages = useMemo(() => {
    if (languageState.status !== 'ready') {
      return [];
    }

    if (tab === 'tree' || (tab === 'find' && searchState.status === 'idle')) {
      if (messageId) {
        return languageState.language.messages.filter((m) =>
          m.id.startsWith(messageId),
        );
      }
      return languageState.language.messages;
    }

    if (tab === 'find') {
      return languageState.language.messages.filter((m) => {
        const translation = languageState.language.translations[m.id];
        return (
          textIncludesQuery(m.id, searchState.query) ||
          textIncludesQuery(m.defaultMessage, searchState.query) ||
          (translation &&
            textIncludesQuery(translation.text, searchState.query))
        );
      });
    }

    return [];
  }, [
    languageState.language?.messages,
    languageState.language?.translations,
    languageState.status,
    messageId,
    searchState.query,
    searchState.status,
    tab,
  ]);

  return (
    <SearchContextProvider value={searchState}>
      <Box sx={{ display: 'flex', minHeight: '100dvh' }}>
        <SidebarContextProvider>
          <Header>
            {tab === 'find' && searchState.status === 'busy' ? (
              <Box>
                <Typography component="span">Search results for</Typography>{' '}
                <Typography
                  component="span"
                  sx={{ backgroundColor: 'yellow', p: 1 }}
                >
                  {searchState.query}
                </Typography>
              </Box>
            ) : (
              <Breadcrumbs
                languageName={languageName}
                messageId={messageId}
                projectName={projectName}
              />
            )}
          </Header>
          <Sidebar>
            <TitleBar languageName={languageName} projectName={projectName} />
            <TabContext value={tab}>
              <Box
                sx={{
                  borderBottom: 1,
                  borderColor: 'divider',
                }}
              >
                <TabList
                  aria-label="Navigation"
                  onChange={onChangeTab}
                  sx={{
                    '& .MuiTab-root': {
                      minHeight: 48,
                    },
                    minHeight: 48,
                  }}
                  variant="fullWidth"
                >
                  <Tab
                    icon={<ListIcon />}
                    iconPosition="start"
                    label="List"
                    value="tree"
                  />
                  <Tab
                    icon={<SearchIcon />}
                    iconPosition="start"
                    label="Find"
                    value="find"
                  />
                </TabList>
              </Box>
              <TabPanel sx={{ overflowX: 'auto', padding: 0 }} value="tree">
                {languageState.status === 'loading' && (
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
                {languageState.status === 'ready' && (
                  <MessageTree
                    messageId={messageId}
                    messages={languageState.language.messages}
                    onItemSelectionToggle={onItemSelectionToggle}
                  />
                )}
              </TabPanel>
              <TabPanel
                sx={{
                  padding: 0,
                }}
                value="find"
              >
                <Box height="100%" p={2}>
                  <TextField
                    label="Search"
                    onChange={onChangeSearchQuery}
                    value={searchState.query}
                    variant="outlined"
                  />
                  <Box>
                    <Typography variant="caption">
                      {searchState.status === 'busy' &&
                        `${messages.length} results`}
                    </Typography>
                  </Box>
                </Box>
              </TabPanel>
            </TabContext>
          </Sidebar>
        </SidebarContextProvider>
        <Main>
          {languageState.status === 'loading' && (
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
          {languageState.status === 'not-found' && (
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
          {languageState.status === 'ready' && (
            <>
              {tab === 'find' &&
              searchState.status === 'busy' &&
              messages.length === 0 ? (
                <Box
                  alignItems="center"
                  display="flex"
                  flexDirection="column"
                  height="100%"
                  justifyContent="center"
                >
                  <ErrorIcon fontSize="large" />
                  <Typography component="span" fontWeight="bold" variant="h6">
                    No messages found matching &apos;{searchState.query}&apos;
                  </Typography>
                </Box>
              ) : (
                <MessageList
                  languageName={languageName}
                  messages={messages}
                  projectName={projectName}
                  translations={languageState.language.translations}
                />
              )}
            </>
          )}
        </Main>
      </Box>
    </SearchContextProvider>
  );
};

export default MessagesPage;
