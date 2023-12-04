'use client';

import { MessageData } from '@/utils/readTypedMessages';
import MessageForm from '@/components/MessageForm';
import { Box, Button, Link, Typography } from '@mui/joy';
import { useEffect, useState } from 'react';

export default function Home({ params }: { params: { lang: string } }) {
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [pullRequestUrl, setPullRequestUrl] = useState<string>('');

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
        {messages.map((msg) => {
          return (
            <MessageForm
              key={msg.id}
              message={msg}
              onSave={async (text) => {
                await fetch(
                  `/api/translations/${params.lang}/${msg.id}`,
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
