import { NextPage } from 'next';
import { notFound } from 'next/navigation';
import React from 'react';

import MessageList from '@/components/MessageList';
import { accessLanguage } from '@/dataAccess';
import { info, toHex, warn } from '@/utils/log';

const MessagesPage: NextPage<{
  params: { languageName: string; messageId?: string; projectName: string };
}> = async ({ params }) => {
  const { languageName, messageId, projectName } = params;
  const languageData = await accessLanguage(projectName, languageName);
  if (!languageData) {
    warn(
      `No language data found for project with code units ${toHex(projectName)}`,
    );
    return notFound();
  }

  info(
    `Found ${languageData?.messages.length} messages for language '${languageName}' in project '${projectName}'`,
  );

  const { messages, translations } = languageData;
  const translationCount = Object.keys(translations).length;
  const percentage = Math.round((100 * translationCount) / messages.length);
  info(
    `Found ${translationCount} translations (${percentage}%) for language '${languageName}' in project '${projectName}'`,
  );

  const prefix = messageId ?? '';
  const filteredMessages = messages.filter((message) =>
    message.id.startsWith(prefix),
  );

  if (filteredMessages.length === 0) {
    return notFound();
  }

  filteredMessages.sort((m0, m1) => {
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

  return (
    <MessageList
      languageName={languageName}
      messages={filteredMessages}
      projectName={projectName}
      translations={translations}
    />
  );
};

export default MessagesPage;
