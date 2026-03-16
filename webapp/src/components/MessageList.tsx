'use client';

import { ListItem, useMediaQuery, useTheme } from '@mui/material';
import React, { FC, useCallback, useEffect, useState } from 'react';
import { FixedSizeList, ListChildComponentProps, ListOnItemsRenderedProps } from 'react-window';

import MessageForm, {
  FrontendTranslationState,
  messageFormHeight,
} from '@/components/MessageForm';
import { Message, MessageTranslation } from '@/api/generated';
import { useMessageStore } from '@/store/messageStore';

type MessageListProps = {
  languageName: string;
  messages: Message[];
  onLoadMore?: () => void;
  projectId: number;
  repoName: string;
};

const mapToFrontendTranslationState = (
  translation: MessageTranslation | undefined,
): FrontendTranslationState => {
  if (!translation) {
    return { status: 'missing', translationText: '' };
  }

  switch (translation.state) {
    case 'SUBMITTED':
      return { status: 'updated', translationText: translation.text };
    case 'PUBLISHED':
    case 'PART_OF_PULL_REQUEST':
      return { status: 'published', translationText: translation.text };
  }
};

const MessageList: FC<MessageListProps> = ({
  languageName,
  messages,
  onLoadMore,
  projectId,
  repoName,
}) => {
  const theme = useTheme();
  const [height, setHeight] = useState<number | undefined>(undefined);

  const lg = useMediaQuery(theme.breakpoints.up('lg'));
  const layout = lg ? 'grid' : 'linear';
  const saveTranslation = useMessageStore((state) => state.saveTranslation);
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

  const onItemsRendered = useCallback(
    ({ visibleStopIndex }: ListOnItemsRenderedProps) => {
      if (onLoadMore && visibleStopIndex >= messages.length - 10) {
        onLoadMore();
      }
    },
    [messages.length, onLoadMore],
  );

  const renderRow = useCallback(
    (props: ListChildComponentProps): React.ReactElement => {
      const { index, style } = props;
      const message = messages[index];
      const translation = message.translations?.[languageName];
      return (
        <ListItem component="div" disablePadding style={style}>
          <MessageForm
            frontendTranslationState={mapToFrontendTranslationState(
              translation,
            )}
            languageName={languageName}
            layout={layout}
            message={message}
            onSaveTranslation={(translation: string) =>
              saveTranslation({
                i18nKey: message.i18nKey,
                lang: languageName,
                projectId,
                repositoryName: repoName,
                translation,
              })
            }
          />
        </ListItem>
      );
    },
    [languageName, layout, messages, projectId, repoName, saveTranslation],
  );

  return (
    <>
      {height && (
        <FixedSizeList
          height={height}
          itemCount={messages.length}
          itemSize={messageFormHeight(layout)}
          onItemsRendered={onItemsRendered}
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
