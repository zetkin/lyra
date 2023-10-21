import { MessageData } from "@/utils/readTypedMessages";
import { Box, Grid, List, ListItem, Textarea, Typography } from "@mui/joy";
import { FC } from "react";

type Props = {
  message: MessageData;
};

const MessageForm: FC<Props> = ({ message }) => {
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
        <Textarea value="" minRows={2} />
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
