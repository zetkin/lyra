'use client';

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Grid,
  List,
  ListItem,
  Snackbar,
  TextField,
  Typography,
} from '@mui/material';
import { FC, useCallback, useState } from 'react';
import { useTheme } from '@mui/material';

import updateTranslation, {
  TranslationState,
} from '@/actions/updateTranslation';
import { type MessageData } from '@/utils/adapters';

type MessageFormProps = {
  languageName: string;
  message: MessageData;
  projectName: string;
  translation: string;
};

const MessageForm: FC<MessageFormProps> = ({
  languageName,
  message,
  projectName,
  translation,
}) => {
  const theme = useTheme();
  const [state, setState] = useState<TranslationState>({
    translationStatus: 'idle',
    translationText: translation,
  });

  const onChange = useCallback(
    (ev: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (state.translationStatus === 'updating') {
        return;
      }
      setState((s) => ({
        ...s,
        original: s.translationStatus === 'modified' ? s.original : translation,
        translationStatus: 'modified',
        translationText: ev.target.value,
      }));
    },
    [state.translationStatus, translation],
  );

  const onSave = useCallback(async () => {
    if (state.translationStatus !== 'modified') {
      return;
    }
    setState({
      original: state.original,
      translationStatus: 'updating',
      translationText: state.translationText,
    });
    const response = await updateTranslation(
      projectName,
      languageName,
      message.id,
      state.translationText,
      state.original,
    );
    setState(response);
  }, [languageName, message.id, projectName, state]);

  const onReset = useCallback(() => {
    setState((s) => {
      if (
        s.translationStatus === 'modified' ||
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

  return (
    <>
      <Grid
        key={message.id}
        alignContent="center"
        px={2}
        spacing={2}
        sx={{ height: '200px', width: '100%' }}
      >
        <Grid md={6} xs={12}>
          <code>{message.id}</code>
          <Typography>{message.defaultMessage}</Typography>
        </Grid>
        <Grid md={6} xs={12}>
          <Box display="flex" flexDirection="row" gap={1}>
            <TextField
              aria-readonly={state.translationStatus === 'updating'}
              InputProps={{ readOnly: state.translationStatus === 'updating' }}
              minRows={2}
              multiline
              onChange={onChange}
              sx={{ flexGrow: 1 }}
              value={state.translationText}
            />
            {(state.translationStatus === 'modified' ||
              state.translationStatus === 'error') && (
              <Button onClick={onSave}>Save</Button>
            )}
            {state.translationStatus === 'updating' && (
              <Button aria-label="Saving" disabled>
                <CircularProgress />
              </Button>
            )}
            {(state.translationStatus === 'modified' ||
              state.translationStatus === 'error' ||
              state.translationStatus === 'updating') && (
              <Button
                aria-label="Reset"
                disabled={state.translationStatus === 'updating'}
                onClick={onReset}
                variant="outlined"
              >
                ↺
              </Button>
            )}
          </Box>
          {!!message.params.length && (
            <Box>
              <Typography>You can use the following parameters:</Typography>
              <List
                sx={{
                  columnGap: theme.spacing(1),
                  display: 'flex',
                  flexDirection: 'row',
                }}
              >
                {message.params.map((param) => {
                  return (
                    <ListItem
                      key={param.name}
                      sx={{ padding: 0, width: 'auto' }}
                    >
                      <code>{param.name}</code>
                    </ListItem>
                  );
                })}
              </List>
            </Box>
          )}
        </Grid>
      </Grid>
      {state.translationStatus === 'success' && (
        <Snackbar open>
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
        <Snackbar open>
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
    </>
  );
};

export default MessageForm;
