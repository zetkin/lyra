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
  translations: Record<string, string>;
};

const MessageList: FC<MessageListProps> = ({
  languageName,
  messages,
  projectName,
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
            translation={translations[message.id] || ''}
          />
        </ListItem>
      );
    },
    [languageName, messages, projectName, translations],
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
