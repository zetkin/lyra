import { MessageData } from '@/utils/readTypedMessages';
import {
  Box,
  Button,
  Grid,
  List,
  ListItem,
  Textarea,
  Typography,
} from '@mui/joy';
import { FC, useEffect, useState } from 'react';

type Props = {
  message: MessageData;
  // eslint-disable-next-line no-unused-vars
  onSave: (text: string) => void;
  translation: string;
};

const MessageForm: FC<Props> = ({ message, onSave, translation }) => {
  const [text, setText] = useState(translation);

  useEffect(() => {
    setText(translation);
  }, [translation]);

  const edited = text != translation;

  return (
    <Grid
      key={message.id}
      borderTop="1px solid silver"
      container
      my={1}
      py={1}
      spacing={2}
      sx={{ width: '100%' }}
    >
      <Grid md={6} xs={12}>
        <code>{message.id}</code>
        <Typography>{message.defaultMessage}</Typography>
      </Grid>
      <Grid md={6} xs={12}>
        <Box display="flex" flexDirection="row" gap={1}>
          <Textarea
            minRows={2}
            onChange={(ev) => setText(ev.target.value)}
            sx={{ flexGrow: 1 }}
            value={text}
          />
          {edited && <Button onClick={() => onSave(text)}>Save</Button>}
          {edited && (
            <Button onClick={() => setText(translation)} variant="outlined">
              ↺
            </Button>
          )}
        </Box>
        {!!message.params.length && (
          <Box>
            <Typography>You can use the following parameters:</Typography>
            <List>
              {message.params.map((param) => {
                return (
                  <ListItem key={param.name}>
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
