'use client';

import { PlainArg, parse } from '@messageformat/parser';
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
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTheme } from '@mui/material';

import { type TranslationState } from '@/app/api/projects/[projectName]/languages/[languageId]/messages/[messageId]/route';
import { type MessageData } from '@/utils/adapters';

export type MessageFormLayout = 'linear' | 'grid';

export function messageFormHeight(layout: MessageFormLayout): number {
  return layout === 'linear' ? 300 : 220;
}

type MessageFormProps = {
  languageName: string;
  layout: MessageFormLayout;
  message: MessageData;
  projectName: string;
  translation: string;
};

const MessageForm: FC<MessageFormProps> = ({
  languageName,
  layout,
  message,
  projectName,
  translation,
}) => {
  const theme = useTheme();
  const resetValue = useRef(translation);
  const lg = useMediaQuery(theme.breakpoints.up('lg'));

  const [state, setState] = useState<TranslationState>({
    translationStatus: 'idle',
    translationText: translation,
  });

  useEffect(() => {
    resetValue.current = translation;
  }, [translation]);

  const onChange = useCallback(
    (ev: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (state.translationStatus === 'updating') {
        return;
      }
      let ast;
      try {
        ast = parse(ev.target.value);
      } catch (e) {
        if (e instanceof Error) {
          setState({
            original: resetValue.current,
            translationStatus: 'invalid',
            translationText: ev.target.value,
            validationError: e.toString(),
          });
          return;
        }
      }

      const invalidArguments = (ast || []).filter(
        (e) =>
          e.type === 'argument' &&
          !message.params.some((p) => p.name === e.arg),
      ) as PlainArg[];
      if (invalidArguments.length > 0) {
        setState({
          original: resetValue.current,
          translationStatus: 'invalid',
          translationText: ev.target.value,
          validationError:
            `"${invalidArguments[0].arg}" is not available in this message.` +
            '\n' +
            `Valid parameters are: ${message.params.map((p) => `"${p.name}"`).join(', ')}`,
        });
        return;
      }

      setState({
        original: resetValue.current,
        translationStatus: 'modified',
        translationText: ev.target.value,
      });
    },
    [state.translationStatus, message.params],
  );

  const onSave = useCallback(async () => {
    if (
      state.translationStatus !== 'modified' &&
      state.translationStatus !== 'error'
    ) {
      return;
    }
    setState({
      original: state.original,
      translationStatus: 'updating',
      translationText: state.translationText,
    });

    /**
     * Note that setState only affects the following renders,
     * not the current one. Our variable state will still have
     * its old values in the following lines, not updated by
     * setState in the lines above.
     *
     * Please be careful if you change setState above to affect
     * its use below, or if you change our use below to be
     * affected by setState above.
     */
    const url = `/api/projects/${projectName}/languages/${languageName}/messages/${message.id}`;
    const body = {
      original: state.original,
      translation: state.translationText,
    };
    const response = await fetch(url, {
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    });
    const json = await response.json();

    if (json.translationStatus === 'success') {
      resetValue.current = json.translationText;
    }
    setState(json);
  }, [languageName, message.id, projectName, state]);

  const onReset = useCallback(() => {
    setState((s): TranslationState => {
      if (
        s.translationStatus === 'modified' ||
        s.translationStatus === 'invalid' ||
        s.translationStatus === 'error'
      ) {
        return {
          translationStatus: 'idle',
          translationText: s.original,
        };
      }
      return s;
    });
  }, []);

  const onDismissSnackbar = useCallback(() => {
    setState((s) => {
      if (s.translationStatus === 'error') {
        return {
          original: s.original,
          translationStatus: 'modified',
          translationText: s.translationText,
        };
      }
      if (s.translationStatus === 'success') {
        return {
          translationStatus: 'idle',
          translationText: s.translationText,
        };
      }
      return s;
    });
  }, []);

  const messageIdParts = useMemo(() => message.id.split('.'), [message.id]);

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
          {state.translationStatus !== 'invalid' ? (
            <>
              <Typography
                component="h2"
                maxWidth="100%"
                overflow="hidden"
                textOverflow="ellipsis"
                whiteSpace="nowrap"
                width="100%"
              >
                {messageIdParts.map((part, i) => (
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
                ))}
              </Typography>
              <Typography color="text.primary">
                {message.defaultMessage}
              </Typography>
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
                  ? state.validationError
                  : state.validationError
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
            aria-readonly={state.translationStatus === 'updating'}
            error={state.translationStatus === 'invalid'}
            fullWidth
            InputLabelProps={{ shrink: true }}
            InputProps={{ readOnly: state.translationStatus === 'updating' }}
            label="Translation"
            maxRows={4}
            minRows={4}
            multiline
            onChange={onChange}
            sx={{ flexGrow: 1 }}
            value={state.translationText}
          />
          <ButtonGroup
            aria-label="Translation actions"
            sx={{ justifyContent: 'flex-end' }}
          >
            {(state.translationStatus === 'modified' ||
              state.translationStatus === 'invalid' ||
              state.translationStatus === 'error' ||
              state.translationStatus === 'updating') && (
              <Button
                disabled={state.translationStatus === 'updating'}
                onClick={onReset}
                startIcon={<RestartAlt />}
              >
                Reset
              </Button>
            )}
            <LoadingButton
              disabled={
                state.translationStatus === 'idle' ||
                state.translationStatus === 'invalid' ||
                state.translationStatus === 'success'
              }
              loading={state.translationStatus === 'updating'}
              loadingPosition="start"
              onClick={onSave}
              startIcon={
                state.translationStatus === 'idle' &&
                state.translationText === '' ? (
                  <MuiError />
                ) : (
                  <Check />
                )
              }
              sx={{ minWidth: 'max-content' }}
            >
              {state.translationStatus === 'idle'
                ? state.translationText
                  ? 'Published'
                  : 'Missing'
                : state.translationStatus === 'success'
                  ? 'Updated'
                  : 'Save'}
            </LoadingButton>
          </ButtonGroup>
        </Box>

        {state.translationStatus === 'success' && (
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
        {state.translationStatus === 'error' && (
          <Snackbar open sx={{ position: 'absolute' }}>
            <Alert
              onClose={onDismissSnackbar}
              severity="error"
              sx={{ width: '100%' }}
              variant="filled"
            >
              {state.errorMessage}
            </Alert>
          </Snackbar>
        )}
      </Box>
    </>
  );
};

export default MessageForm;
