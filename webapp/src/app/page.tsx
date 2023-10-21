"use client";

import { MessageData } from "@/utils/readTypedMessages";
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
      <h1>Messages</h1>
      <ul>
        {messages.map((msg) => {
          return (
            <li key={msg.id}>
              <code>{msg.id}</code>
              <p>{msg.defaultMessage}</p>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
