'use client';

import { ListItem, useMediaQuery, useTheme } from '@mui/material';
import { FC, useCallback, useEffect, useState } from 'react';
import { FixedSizeList, ListChildComponentProps } from 'react-window';

import MessageForm, { messageFormHeight } from '@/components/MessageForm';
import { MessageData, TranslateIdTextState } from '@/utils/adapters';

type MessageListProps = {
  languageName: string;
  messages: MessageData[];
  projectName: string;
  translations: TranslateIdTextState;
};

const MessageList: FC<MessageListProps> = ({
  languageName,
  messages,
  projectName,
  translations,
}) => {
  const theme = useTheme();
  const [height, setHeight] = useState<number | undefined>(undefined);

  const lg = useMediaQuery(theme.breakpoints.up('lg'));
  const layout = lg ? 'grid' : 'linear';

  const onResize = useCallback(() => {
    const headerHeight = parseInt(
      getComputedStyle(document.documentElement).getPropertyValue(
        '--Header-height',
      ),
    );
    setHeight(window.innerHeight - headerHeight);
  }, []);

  useEffect(() => {
    if (typeof window === 'object') {
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
            translation={
              translations[message.id]
                ? translations[message.id].state === 'UPDATED'
                  ? {
                      translationStatus: 'updated',
                      translationText: translations[message.id].text,
                    }
                  : {
                      translationStatus: 'published',
                      translationText: translations[message.id].text,
                    }
                : { translationStatus: 'missing', translationText: '' }
            }
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
          height={height}
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
