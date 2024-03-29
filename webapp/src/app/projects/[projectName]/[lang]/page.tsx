'use client';

import { type MessageData } from '@/utils/adapters';
import MessageForm from '@/components/MessageForm';
import { SafeRecord } from '@/utils/types';
import { Box, Button, Input, Link, Typography } from '@mui/joy';
import { useEffect, useMemo, useState } from 'react';

export default function Home(context: {
  params: { lang: string; projectName: string };
}) {
  const [filterText, setFilterText] = useState('');
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [translations, setTranslations] = useState<SafeRecord<string, string>>(
    {},
  );
  const [pullRequestUrl, setPullRequestUrl] = useState<string>('');
  const MESSAGES_PER_PAGE = 50; // number of messages to show per page
  const [msgOffset, setOffset] = useState<{ from: number; to: number }>({
    from: 0,
    to: MESSAGES_PER_PAGE,
  });

  const sortedMessages = useMemo(() => {
    return messages.sort((m0, m1) => {
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
  }, [messages, translations]);

  const filteredMessages = useMemo(() => {
    return sortedMessages.filter((message) => {
      const trans = translations[message.id]?.toLowerCase();
      const filterQuery = filterText.toLowerCase();

      return (
        trans?.includes(filterQuery) ||
        message.defaultMessage.includes(filterQuery) ||
        message.id.includes(filterQuery)
      );
    });
  }, [sortedMessages, filterText]);

  const {
    params: { lang, projectName },
  } = context;

  useEffect(() => {
    async function loadMessages() {
      const res = await fetch(`/api/messages/${projectName}`);
      const payload = await res.json();
      setMessages(payload.data);
      setOffset((prevMsgOffset) => ({
        from: 0,
        to: Math.min(
          prevMsgOffset.from + MESSAGES_PER_PAGE,
          payload.data.length,
        ),
      }));
    }

    loadMessages();
  }, []);

  useEffect(() => {
    async function loadTranslations() {
      const res = await fetch(`/api/translations/${projectName}/${lang}`);
      const payload = await res.json();
      setTranslations(payload.translations);
    }

    loadTranslations();
  }, []);

  return (
    <main>
      <Typography level="h1">Messages</Typography>
      <Button
        onClick={async () => {
          const res = await fetch(`/api/pull-request/${projectName}/`, {
            method: 'POST',
          });
          const payload = await res.json();
          const url = payload.pullRequestUrl;
          setPullRequestUrl(url);
        }}
      >
        Create Pull-Request
      </Button>
      {pullRequestUrl && <Link href={pullRequestUrl}> {pullRequestUrl} </Link>}
      <p />
      <Box>
        <Button
          onClick={() => {
            setOffset(() => {
              return {
                from: 0,
                to: Math.min(MESSAGES_PER_PAGE, messages.length),
              };
            });
          }}
        >
          First
        </Button>
        <text> </text>
        <Button
          onClick={() => {
            setOffset((prevMsgOffset) => {
              const from = Math.max(0, prevMsgOffset.from - MESSAGES_PER_PAGE);
              return {
                from,
                to: Math.min(from + MESSAGES_PER_PAGE, messages.length),
              };
            });
          }}
        >
          Previous
        </Button>
        <text>
          From: {msgOffset.from + 1} to: {msgOffset.to} of total:{' '}
          {messages.length}
        </text>
        <Button
          onClick={() => {
            setOffset((prevMsgOffset) => {
              if (prevMsgOffset.to >= messages.length) {
                return prevMsgOffset;
              }
              const from = Math.max(0, prevMsgOffset.from + MESSAGES_PER_PAGE);
              return {
                from,
                to: Math.min(from + MESSAGES_PER_PAGE, messages.length),
              };
            });
          }}
        >
          Next
        </Button>
        <Box>
          <Input
            onChange={(ev) => {
              setFilterText(ev.target.value);
            }}
            value={filterText}
          />
        </Box>
      </Box>
      <Box>
        {filteredMessages.slice(msgOffset.from, msgOffset.to).map((msg) => {
          return (
            <MessageForm
              key={msg.id}
              message={msg}
              onSave={async (text) => {
                await fetch(
                  `/api/translations/${projectName}/${lang}/${msg.id}`,
                  {
                    body: JSON.stringify({
                      text,
                    }),
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    method: 'PUT',
                  },
                );

                setTranslations((cur) => ({
                  ...cur,
                  [msg.id]: text,
                }));
              }}
              translation={translations[msg.id] || ''}
            />
          );
        })}
      </Box>
    </main>
  );
}
