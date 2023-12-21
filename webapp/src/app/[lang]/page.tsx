'use client';

import { type MessageData } from '@/utils/adapters';
import MessageForm from '@/components/MessageForm';
import { Box, Button, Link, Typography } from '@mui/joy';
import { useEffect, useState } from 'react';

export default function Home({ params }: { params: { lang: string } }) {
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [pullRequestUrl, setPullRequestUrl] = useState<string>('');
  const [offset, setOffset] = useState(0);
  const MESSAGES_PER_PAGE = 50; // number of messages to show per page

  useEffect(() => {
    async function loadMessages() {
      const res = await fetch('/api/messages');
      const payload = await res.json();
      setMessages(payload.data);
    }

    loadMessages();
  }, []);

  useEffect(() => {
    async function loadTranslations() {
      const res = await fetch(`/api/translations/${params.lang}`);
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
          const res = await fetch('/api/pull-request/', {
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
      <Box>
        <Button
          onClick={() => {
            setOffset((prevOffset) => Math.max(0, prevOffset - MESSAGES_PER_PAGE));
          }}
        >
          Previous
        </Button>
        <text>
          From: {offset} to: {offset + MESSAGES_PER_PAGE}
        </text>
        <Button
          onClick={() => {
            setOffset((prevOffset) =>
              Math.min(messages.length - MESSAGES_PER_PAGE, prevOffset + MESSAGES_PER_PAGE),
            );
          }}
        >
          Next
        </Button>
      </Box>
      <Box>
        {messages.slice(offset, offset + MESSAGES_PER_PAGE).map((msg) => {
          return (
            <MessageForm
              key={msg.id}
              message={msg}
              onSave={async (text) => {
                await fetch(`/api/translations/sv/${msg.id}`, {
                  body: JSON.stringify({
                    text,
                  }),
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  method: 'PUT',
                });

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
