"use client";

import MessageForm from "@/components/MessageForm";
import { MessageData } from "@/utils/readTypedMessages";
import { Box, Button, Typography } from "@mui/joy";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Home({ params }: { params: { lang: string } }) {
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [translations, setTranslations] = useState<Record<string, string>>({});

  useEffect(() => {
    async function loadMessages() {
      const res = await fetch("/api/messages");
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
          const res = await fetch(`/api/pull-request/`, {
            method: "POST",
          });
        }}
      >
        Create Pull-Request
      </Button>
      <Box>
        {messages.map((msg) => {
          return (
            <MessageForm
              key={msg.id}
              message={msg}
              onSave={async (text) => {
                const res = await fetch(
                  `/api/translations/${params.lang}/${msg.id}`,
                  {
                    method: "PUT",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      text,
                    }),
                  },
                );

                const payload = await res.json();
                setTranslations((cur) => ({
                  ...cur,
                  [msg.id]: text,
                }));
              }}
              translation={translations[msg.id] || ""}
            />
          );
        })}
      </Box>
    </main>
  );
}
