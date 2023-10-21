"use client";

import MessageForm from "@/components/MessageForm";
import { MessageData } from "@/utils/readTypedMessages";
import { Box, Textarea, Typography } from "@mui/joy";
import { useEffect, useState } from "react";

export default function Home() {
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
      const res = await fetch("/api/translations/en");
      const payload = await res.json();
      setTranslations(payload.translations);
    }

    loadTranslations();
  }, []);

  return (
    <main>
      <Typography level="h1">Messages</Typography>
      <Box>
        {messages.map((msg) => {
          return (
            <MessageForm
              key={msg.id}
              message={msg}
              translation={translations[msg.id] || ""}
            />
          );
        })}
      </Box>
    </main>
  );
}
