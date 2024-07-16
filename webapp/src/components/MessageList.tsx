'use client';

import { ListItem } from '@mui/material';
import { FC, useCallback, useEffect, useState } from 'react';
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
  const [height, setHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (typeof window === 'object') {
      const headerHeight = parseInt(
        getComputedStyle(document.documentElement).getPropertyValue(
          '--Header-height',
        ),
      );
      setHeight(window.innerHeight - headerHeight);
    }
    const handleResize = () => {
      setHeight(window.innerHeight);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const renderRow = useCallback(
    (props: ListChildComponentProps): JSX.Element => {
      const { index, style } = props;
      const message = messages[index];
      return (
        <ListItem component="div" disablePadding style={style}>
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

  return (
    <>
      {height && (
        <FixedSizeList
          height={height}
          itemCount={messages.length}
          itemSize={200}
          overscanCount={5}
          width="100%"
        >
          {renderRow}
        </FixedSizeList>
      )}
    </>
  );
};

export default MessageList;
