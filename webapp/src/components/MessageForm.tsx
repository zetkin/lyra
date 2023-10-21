import { MessageData } from "@/utils/readTypedMessages";
import { Box, Grid, List, ListItem, Textarea, Typography } from "@mui/joy";
import { FC, useEffect, useState } from "react";

type Props = {
  message: MessageData;
  translation: string;
};

const MessageForm: FC<Props> = ({ message, translation }) => {
  const [text, setText] = useState(translation);

  useEffect(() => {
    setText(translation);
  }, [translation]);

  return (
    <Grid
      container
      key={message.id}
      sx={{ width: "100%" }}
      my={1}
      py={1}
      borderTop="1px solid silver"
      spacing={2}
    >
      <Grid md={6} xs={12}>
        <code>{message.id}</code>
        <Typography>{message.defaultMessage}</Typography>
      </Grid>
      <Grid md={6} xs={12}>
        <Box display="flex" flexDirection="row" gap={1}>
          <Textarea
            value={text}
            minRows={2}
          />
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
