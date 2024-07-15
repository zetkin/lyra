'use client';

import ListItem from '@mui/material/ListItem';
import { FC, useCallback, useEffect, useState } from 'react';
import { FixedSizeList, ListChildComponentProps } from 'react-window';
import { useTheme } from '@mui/material';

import MessageForm, {
  messageFormHeight,
  MessageFormLayout,
} from '@/components/MessageForm';
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
  const theme = useTheme();
  const [height, setHeight] = useState<number | undefined>(undefined);
  const [layout, setLayout] = useState<MessageFormLayout>('linear');

  const onResize = useCallback(() => {
    setHeight(window.innerHeight);
    setLayout(
      window.innerWidth > theme.breakpoints.values.lg ? 'grid' : 'linear',
    );
  }, [theme.breakpoints.values.lg]);

  useEffect(() => {
    if (typeof window === 'object') {
      document.body.style.overflow = 'hidden';
      onResize();
      window.addEventListener('resize', onResize);
      return () => window.removeEventListener('resize', onResize);
    }
  }, [onResize]);

  const renderRow = useCallback(
    (props: ListChildComponentProps): JSX.Element => {
      const { index, style } = props;
      const message = messages[index];
      return (
        <ListItem component="div" disablePadding style={style}>
          <MessageForm
            languageName={languageName}
            layout={layout}
            message={message}
            projectName={projectName}
            translation={translations[message.id] || ''}
          />
        </ListItem>
      );
    },
    [languageName, layout, messages, projectName, translations],
  );

  return (
    <>
      {height && (
        <FixedSizeList
          height={window.innerHeight}
          itemCount={messages.length}
          itemSize={messageFormHeight(layout)}
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
