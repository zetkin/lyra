'use client';

import { parse } from '@messageformat/parser';
import { Check, Error as MuiError, RestartAlt } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  ButtonGroup,
  Snackbar,
  TextField,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import React, {
  FC,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTheme } from '@mui/material';

import HighlightSearchQuery from './HighlightSearchQuery';
import { Message } from '@/api/generated';
import { useSearchStore } from '@/store/searchStore';
import { titleCaseWord } from '@/utils/stringUtils';

export type MessageFormLayout = 'linear' | 'grid';

export function messageFormHeight(layout: MessageFormLayout): number {
  return layout === 'linear' ? 300 : 220;
}

export type TranslationSuccess = {
  status: 'success';
  translationText: string;
};

type TranslationError = {
  errorMessage: string;
  original: string;
  status: 'error';
  translationText: string;
};

type TranslationMissing = {
  status: 'missing';
  translationText: string;
};

type TranslationPublished = {
  status: 'published';
  translationText: string;
};

type TranslationUpdated = {
  status: 'updated';
  translationText: string;
};

type TranslationInvalid = {
  original: string;
  status: 'invalid';
  translationText: string;
  validationError: string;
};

type TranslationUpdating = {
  original: string;
  status: 'updating';
  translationText: string;
};

type TranslationModified = {
  original: string;
  status: 'modified';
  translationText: string;
};

export type FrontendTranslationState =
  | TranslationPublished
  | TranslationUpdated
  | TranslationMissing
  | TranslationInvalid
  | TranslationUpdating
  | TranslationSuccess
  | TranslationModified
  | TranslationError;

type MessageFormProps = {
  frontendTranslationState: FrontendTranslationState;
  languageName: string;
  layout: MessageFormLayout;
  message: Message;
  onSaveTranslation: (translation: string) => Promise<Message | undefined>;
};

const MessageForm: FC<MessageFormProps> = ({
  frontendTranslationState,
  languageName,
  layout,
  message,
  onSaveTranslation,
}) => {
  const theme = useTheme();
  const searchStore = useSearchStore();
  const resetValue = useRef(frontendTranslationState);
  const lg = useMediaQuery(theme.breakpoints.up('lg'));
  const [translationState, setTranslationState] =
    useState<FrontendTranslationState>(frontendTranslationState);

  useEffect(() => {
    resetValue.current = translationState;
  }, [translationState]);

  const onChange = useCallback(
    (ev: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (translationState.status === 'updating') {
        return;
      }
      try {
        parse(ev.target.value);
      } catch (e) {
        if (e instanceof Error) {
          setTranslationState({
            original: resetValue.current.translationText,
            status: 'invalid',
            translationText: ev.target.value,
            validationError: e.toString(),
          });
          return;
        }
      }
      setTranslationState({
        original: resetValue.current.translationText,
        status: 'modified',
        translationText: ev.target.value,
      });
    },
    [translationState.status],
  );

  const onSave = useCallback(async () => {
    if (
      translationState.status !== 'modified' &&
      translationState.status !== 'error'
    ) {
      return;
    }
    setTranslationState({
      original: translationState.original,
      status: 'updating',
      translationText: translationState.translationText,
    });
    const updatedMessage = await onSaveTranslation(
      translationState.translationText,
    );
    if (updatedMessage) {
      resetValue.current = {
        ...resetValue.current,
        status: 'published',
        translationText: updatedMessage.translations[languageName].text,
      };
      setTranslationState({
        ...translationState,
        status: 'success',
      });
    }
  }, [translationState, onSaveTranslation, languageName]);

  const onReset = useCallback(() => {
    setTranslationState((s): FrontendTranslationState => {
      if (
        s.status === 'modified' ||
        s.status === 'invalid' ||
        s.status === 'error'
      ) {
        return {
          status: s.original ? 'missing' : 'updated',
          translationText: s.original,
        };
      }
      return s;
    });
  }, []);

  const onDismissSnackbar = useCallback(() => {
    setTranslationState((s) => {
      if (s.status === 'error') {
        return {
          original: s.original,
          status: 'modified',
          translationText: s.translationText,
        };
      }
      if (s.status === 'success') {
        return {
          status: 'updated',
          translationText: s.translationText,
        };
      }
      return s;
    });
  }, []);

  const messageIdParts = useMemo(
    () => message.i18nKey.split('.'),
    [message.i18nKey],
  );

  return (
    <>
      <Box
        sx={{
          ':focus-within, :hover': {
            backgroundColor: theme.palette.grey[50],
            outlineColor: theme.palette.primary.main,
            outlineStyle: 'solid',
            outlineWidth: 1,
          },
          backgroundColor: '#fafcfe',
          borderRadius: 2,
          display: 'flex',
          marginLeft: theme.spacing(2),
          marginRight: theme.spacing(2),
          maxHeight: `${messageFormHeight(layout)}px`,
          maxWidth: '100%',
          overflow: 'hidden',
          padding: theme.spacing(2),
          position: 'relative',
          width: '100%',
          ...(layout === 'linear'
            ? {
                flexDirection: 'column',
                rowGap: theme.spacing(2),
              }
            : {
                columnGap: theme.spacing(2),
                flexDirection: 'row',
              }),
        }}
      >
        <Box
          sx={{
            flex: 1,
            maxWidth: '100%',
            minHeight: '3rem',
            overflow: 'hidden',
          }}
        >
          {translationState.status !== 'invalid' ? (
            <>
              <Typography
                component="h2"
                maxWidth="100%"
                overflow="hidden"
                textOverflow="ellipsis"
                whiteSpace="nowrap"
                width="100%"
              >
                {searchStore.isBusy() &&
                searchStore.textIncludesQuery(message.i18nKey) ? (
                  <HighlightSearchQuery
                    query={searchStore.query}
                    text={message.i18nKey}
                  />
                ) : (
                  messageIdParts.map((part, i) => (
                    <Typography
                      key={part}
                      color={
                        i === messageIdParts.length - 1
                          ? 'text.primary'
                          : 'text.secondary'
                      }
                      component="span"
                    >
                      {part}
                      {i < messageIdParts.length - 1 && '.'}
                    </Typography>
                  ))
                )}
              </Typography>

              <Box>
                {searchStore.isBusy() &&
                searchStore.textIncludesQuery(message.defaultText) ? (
                  <HighlightSearchQuery
                    query={searchStore.query}
                    text={message.defaultText}
                  />
                ) : (
                  <Typography color="text.primary">
                    {message.defaultText}
                  </Typography>
                )}
              </Box>
            </>
          ) : (
            <Box
              style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                maxHeight: lg ? undefined : '3rem',
                minHeight: lg ? undefined : '3rem',
                overflowY: 'auto',
                rowGap: '0.5rem',
              }}
            >
              {lg && (
                <Typography color="red" variant="subtitle2">
                  Mistake detected in translation string
                </Typography>
              )}
              <Typography
                color="red"
                component="pre"
                sx={{
                  flex: 1,
                  fontFamily: 'monospace',
                  fontSize: '0.8rem',
                  margin: 0,
                  padding: 0,
                }}
              >
                {lg
                  ? translationState.validationError
                  : translationState.validationError
                      .split('\n')
                      .filter((l) => !!l)
                      .join('\n')}
              </Typography>
            </Box>
          )}
        </Box>
        <Box
          sx={{
            display: 'flex',
            flex: 1,
            flexDirection: 'column',
            rowGap: theme.spacing(1),
          }}
        >
          <TextField
            aria-readonly={translationState.status === 'updating'}
            error={translationState.status === 'invalid'}
            fullWidth
            InputLabelProps={{ shrink: true }}
            InputProps={{
              readOnly: translationState.status === 'updating',
            }}
            label="Translation"
            maxRows={4}
            minRows={4}
            multiline
            onChange={onChange}
            sx={{
              '& .MuiInputLabel-root': {
                backgroundColor:
                  searchStore.textIncludesQuery(
                    translationState.translationText,
                  ) && searchStore.isBusy()
                    ? 'yellow'
                    : undefined,
              },
              flexGrow: 1,
            }}
            value={translationState.translationText}
          />
          <ButtonGroup
            aria-label="Translation actions"
            sx={{ justifyContent: 'flex-end' }}
          >
            {(translationState.status === 'modified' ||
              translationState.status === 'invalid' ||
              translationState.status === 'error' ||
              translationState.status === 'updating') && (
              <Button
                disabled={translationState.status === 'updating'}
                onClick={onReset}
                startIcon={<RestartAlt />}
              >
                Reset
              </Button>
            )}
            <LoadingButton
              disabled={
                translationState.status === 'missing' ||
                translationState.status === 'published' ||
                translationState.status === 'updated' ||
                translationState.status === 'invalid' ||
                translationState.status === 'success'
              }
              loading={translationState.status === 'updating'}
              loadingPosition="start"
              onClick={onSave}
              startIcon={
                translationState.status === 'missing' ? <MuiError /> : <Check />
              }
              sx={{ minWidth: 'max-content' }}
            >
              {titleCaseWord(translationState.status)}
            </LoadingButton>
          </ButtonGroup>
        </Box>

        {translationState.status === 'success' && (
          <Snackbar open sx={{ position: 'absolute' }}>
            <Alert
              onClose={onDismissSnackbar}
              severity="success"
              sx={{ width: '100%' }}
              variant="filled"
            >
              Translation updated
            </Alert>
          </Snackbar>
        )}
        {translationState.status === 'error' && (
          <Snackbar open sx={{ position: 'absolute' }}>
            <Alert
              onClose={onDismissSnackbar}
              severity="error"
              sx={{ width: '100%' }}
              variant="filled"
            >
              {translationState.errorMessage}
            </Alert>
          </Snackbar>
        )}
      </Box>
    </>
  );
};

export default MessageForm;
