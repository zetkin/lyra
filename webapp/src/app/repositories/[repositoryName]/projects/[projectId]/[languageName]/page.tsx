'use client';

import { NextPage } from 'next';
import { useSearchParams } from 'next/navigation';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
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
import { useMessageStore } from '@/store/messageStore';
import { useSearchStore } from '@/store/searchStore';
import { Message } from '@/api/generated';

type TabId = 'tree' | 'find';

type MessagePageProps = {
  languageName: string;
  messageId?: string;
  projectId: number;
  repositoryName: string;
};

const MESSAGE_LOADING_LIMIT = 50;

type MessageLoadingState = 'loading' | 'ready' | 'not-found';

const MessagesPage: NextPage<{ params: MessagePageProps }> = (props) => {
  const { repositoryName, languageName, messageId, projectId } = props.params;
  const [msgId, setMsgId] = useState<string | undefined>(messageId);
  const [loadingStatus, setLoadingLoadingStatus] =
    useState<MessageLoadingState>('loading');
  const isLoadingMoreRef = useRef(false);
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('query');
  const [tab, setTab] = useState<TabId>(initialQuery ? 'find' : 'tree');
  const [messages, setMessages] = useState<Message[]>([]);
  const searchStore = useSearchStore();
  const fetchMessage = useMessageStore((state) => state.fetchMessages);
  const fetchMessages = useMessageStore((state) => state.fetchMessages);

  useEffect(() => {
    const props = {
      lang: languageName,
      limit: MESSAGE_LOADING_LIMIT,
      offset: 0,
      projectId,
      repositoryName,
    };
    if (!msgId) {
      setLoadingLoadingStatus('loading');
      fetchMessages(props).then((msgs) => {
        setLoadingLoadingStatus('ready');
        setMessages(msgs);
      });
      return;
    }
    setLoadingLoadingStatus('loading');
    fetchMessages({ ...props, messageId: msgId }).then((msgs) => {
      if (msgs.length === 0) {
        setLoadingLoadingStatus('not-found');
        return;
      }
      setLoadingLoadingStatus('ready');
      setMessages(msgs);
    });
  }, [
    projectId,
    languageName,
    msgId,
    repositoryName,
    fetchMessage,
    fetchMessages,
  ]);

  const onLoadMore = useCallback(() => {
    if (isLoadingMoreRef.current) {
      return;
    }
    isLoadingMoreRef.current = true;
    const props = {
      lang: languageName,
      limit: MESSAGE_LOADING_LIMIT,
      offset: messages.length,
      projectId,
      repositoryName,
    };
    if (!msgId) {
      fetchMessages(props).then((newMsgs) => {
        isLoadingMoreRef.current = false;
        if (newMsgs.length > 0) {
          setMessages((prev) => [...prev, ...newMsgs]);
        }
      });
      return;
    }
    fetchMessages({ ...props, messageId: msgId }).then((newMsgs) => {
      isLoadingMoreRef.current = false;
      if (newMsgs.length > 0) {
        setMessages((prev) => [...prev, ...newMsgs]);
      }
    });
  }, [
    languageName,
    messages.length,
    projectId,
    repositoryName,
    msgId,
    fetchMessages,
  ]);

  const onChangeTab = useCallback(
    (_e: React.SyntheticEvent, newTab: TabId) => {
      if (newTab !== 'find') {
        window.history.pushState(null, '', window.location.pathname);
      }
      if (newTab === 'find') {
        searchStore.resetQuery();
        searchStore.setStatus('idle');
      }
      setTab(newTab);
    },
    [searchStore],
  );

  const onItemSelectionToggle = useCallback(
    (_e: React.SyntheticEvent, id: string, isSelected: boolean) => {
      if (isSelected) {
        setMsgId(id);
        window.history.pushState(
          null,
          '',
          `/repositories/${repositoryName}/projects/${projectId}/${languageName}/${id}`,
        );
      }
    },
    [languageName, projectId, repositoryName],
  );

  const onChangeSearchQuery = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (event.target.value === '') {
        searchStore.resetQuery();
        searchStore.setStatus('idle');
        window.history.pushState(null, '', window.location.pathname);
      } else {
        searchStore.setQuery(event.target.value);
        searchStore.setStatus('busy');
        const params = new URLSearchParams();
        params.set('query', event.target.value);
        const path = [
          'repository',
          repositoryName,
          'projects',
          projectId,
          languageName,
        ];
        if (messageId) {
          path.push(messageId);
        }
        window.history.pushState(null, '', `/${path.join('/')}?${params}`);
      }
    },
    [languageName, messageId, projectId, repositoryName, searchStore],
  );

  const filteredMessages = useMemo(() => {
    if (loadingStatus !== 'ready') {
      return [];
    }

    if (tab === 'tree' || (tab === 'find' && searchStore.status === 'idle')) {
      if (messageId) {
        return messages.filter((m) => m.i18nKey.startsWith(messageId));
      }
      return messages;
    }

    if (tab === 'find') {
      return messages.filter((m) => {
        const translation = m.translations?.[languageName];
        return (
          searchStore.textIncludesQuery(m.i18nKey) ||
          searchStore.textIncludesQuery(m.defaultText) ||
          (translation && searchStore.textIncludesQuery(translation.text))
        );
      });
    }
    return [];
  }, [loadingStatus, tab, searchStore, messageId, messages, languageName]);

  return (
    <Box sx={{ display: 'flex', minHeight: '100dvh' }}>
      <SidebarContextProvider>
        <Header>
          {tab === 'find' && searchStore.isBusy() ? (
            <Box>
              <Typography component="span">Search results for</Typography>{' '}
              <Typography
                component="span"
                sx={{ backgroundColor: 'yellow', p: 1 }}
              >
                {searchStore.query}
              </Typography>
            </Box>
          ) : (
            <Breadcrumbs
              languageName={languageName}
              messageId={messageId}
              projectId={projectId}
              repositoryName={repositoryName}
            />
          )}
        </Header>
        <Sidebar>
          <TitleBar
            languageName={languageName}
            projectId={projectId}
            repositoryName={repositoryName}
          />
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
              {loadingStatus === 'loading' && (
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
              {loadingStatus === 'ready' && (
                <MessageTree
                  messageId={messageId}
                  messages={messages}
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
                  value={searchStore.query}
                  variant="outlined"
                />
                <Box>
                  <Typography variant="caption">
                    {searchStore.isBusy() &&
                      `${filteredMessages.length} results`}
                  </Typography>
                </Box>
              </Box>
            </TabPanel>
          </TabContext>
        </Sidebar>
      </SidebarContextProvider>
      <Main>
        {loadingStatus === 'loading' && (
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
        {loadingStatus === 'not-found' && (
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
        {loadingStatus === 'ready' && (
          <>
            {tab === 'find' &&
            searchStore.isBusy() &&
            filteredMessages.length === 0 ? (
              <Box
                alignItems="center"
                display="flex"
                flexDirection="column"
                height="100%"
                justifyContent="center"
              >
                <ErrorIcon fontSize="large" />
                <Typography component="span" fontWeight="bold" variant="h6">
                  No messages found matching &apos;{searchStore.query}&apos;
                </Typography>
              </Box>
            ) : (
              <MessageList
                languageName={languageName}
                messages={filteredMessages}
                onLoadMore={onLoadMore}
                projectId={projectId}
                repoName={repositoryName}
              />
            )}
          </>
        )}
      </Main>
    </Box>
  );
};

export default MessagesPage;
