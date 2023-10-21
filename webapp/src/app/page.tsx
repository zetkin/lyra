"use client";

import MessageForm from "@/components/MessageForm";
import { MessageData } from "@/utils/readTypedMessages";
import { Box, Textarea, Typography } from "@mui/joy";
import { useEffect, useState } from "react";

export default function Home() {
  const [messages, setMessages] = useState<MessageData[]>([]);

  useEffect(() => {
    async function loadMessages() {
      const res = await fetch("/api/messages");
      const payload = await res.json();
      setMessages(payload.data);
    }

    loadMessages();
  }, []);

  return (
    <main>
      <Typography level="h1">Messages</Typography>
      <Box>
        {messages.map((msg) => {
          return <MessageForm key={msg.id} message={msg} />;
        })}
      </Box>
    </main>
  );
}
