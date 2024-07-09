'use client';

import ListItem from '@mui/material/ListItem';
import { FC, useCallback } from 'react';
import { FixedSizeList, ListChildComponentProps } from 'react-window';

import MessageForm from '@/components/MessageForm';
import { MessageData } from '@/utils/adapters';

type MessageListProps = {
  languageName: string;
  messages: MessageData[];
  projectName: string;
  saveTranslation: (
    projectName: string,
    languageName: string,
    messageId: string,
    translation: string,
  ) => Promise<void>;
  translations: Record<string, string>;
};

const MessageList: FC<MessageListProps> = ({
  languageName,
  messages,
  projectName,
  saveTranslation,
  translations,
}) => {
  const renderRow = useCallback(
    (props: ListChildComponentProps): JSX.Element => {
      const { index, style } = props;
      const message = messages[index];
      return (
        <ListItem key={index} component="div" disablePadding style={style}>
          <MessageForm
            languageName={languageName}
            message={message}
            projectName={projectName}
            saveTranslation={saveTranslation}
            translation={translations[message.id] || ''}
          />
        </ListItem>
      );
    },
    [languageName, messages, projectName, saveTranslation, translations],
  );

  if (typeof window === 'undefined') {
    return;
  }

  return (
    <FixedSizeList
      height={window.innerHeight}
      itemCount={messages.length}
      itemSize={200}
      overscanCount={5}
      width="100%"
    >
      {renderRow}
    </FixedSizeList>
  );
};

export default MessageList;
