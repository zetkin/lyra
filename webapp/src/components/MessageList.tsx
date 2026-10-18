'use client';

import { ListItem, useMediaQuery, useTheme } from '@mui/material';
import { FC, useCallback, useEffect, useState } from 'react';
import { FixedSizeList, ListChildComponentProps } from 'react-window';

import MessageForm, { messageFormHeight } from '@/components/MessageForm';
import { TranslateState } from '@/dao/types';
import { MessageDto } from '@/dto/MessageDto';

type MessageListProps = {
  language: string;
  messages: MessageDto[];
  projectName: string;
};

const MessageList: FC<MessageListProps> = ({
  language,
  messages,
  projectName,
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
      const translation = message.translations.find(
        (t) => t.language === language,
      );
      return (
        <ListItem component="div" disablePadding style={style}>
          <MessageForm
            languageName={language}
            layout={layout}
            message={{
              defaultMessage: message.defaultMessage,
              id: message.i18nKey,
              params: message.params,
            }}
            projectName={projectName}
            translation={
              translation
                ? translation.state === TranslateState.UPDATED
                  ? {
                      translationStatus: 'updated',
                      translationText: translation.text,
                    }
                  : {
                      translationStatus: 'published',
                      translationText: translation.text,
                    }
                : { translationStatus: 'missing', translationText: '' }
            }
          />
        </ListItem>
      );
    },
    [language, layout, messages, projectName],
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
