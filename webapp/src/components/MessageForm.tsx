'use client';

import {
  Box,
  Button,
  CircularProgress,
  Grid,
  List,
  ListItem,
  TextField,
  Typography,
} from '@mui/material';
import { FC, useCallback, useState } from 'react';
import { useTheme } from '@mui/material';

import updateTranslation from '@/actions/updateTranslation';
import { type MessageData } from '@/utils/adapters';

type MessageFormStatus = 'pristine' | 'modified' | 'saving';

type MessageFormState = {
  original: string;
  status: MessageFormStatus;
  text: string;
};

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
  const [{ original, status, text }, setState] = useState<MessageFormState>({
    original: translation,
    status: 'pristine',
    text: translation,
  });

  const onChange = useCallback(
    (ev: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (status === 'saving') {
        return;
      }
      setState((s) => ({ ...s, status: 'modified', text: ev.target.value }));
    },
    [status],
  );

  const onSave = useCallback(async () => {
    setState((s) => ({ ...s, status: 'saving' }));
    await updateTranslation(projectName, languageName, message.id, text);
    setState((s) => ({ ...s, original: text, status: 'pristine' }));
  }, [languageName, message.id, projectName, text]);

  const onReset = useCallback(() => {
    setState((s) => ({ ...s, status: 'pristine', text: original }));
  }, [original]);

  return (
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
            aria-readonly={status === 'saving'}
            InputProps={{ readOnly: status === 'saving' }}
            minRows={2}
            multiline
            onChange={onChange}
            sx={{ flexGrow: 1 }}
            value={text}
          />
          {status !== 'pristine' && (
            <Button
              aria-label={status === 'modified' ? 'Save' : 'Saving'}
              disabled={status === 'saving'}
              onClick={onSave}
            >
              <>
                <>{status === 'modified' && 'Save'}</>
                <>{status === 'saving' && <CircularProgress />}</>
              </>
            </Button>
          )}
          {status !== 'pristine' && (
            <Button
              aria-label="Reset"
              disabled={status === 'saving'}
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
                  <ListItem key={param.name} sx={{ padding: 0, width: 'auto' }}>
                    <code>{param.name}</code>
                  </ListItem>
                );
              })}
            </List>
          </Box>
        )}
      </Grid>
    </Grid>
  );
};

export default MessageForm;
