import { MessageData } from "@/utils/readTypedMessages";
import { Box, Textarea, Typography } from "@mui/joy";
import { FC } from "react";

type Props = {
  message: MessageData;
};

const MessageForm: FC<Props> = ({ message }) => {
  return (
    <Box key={message.id} display="flex" flexDirection="row" my={2}>
      <Box flexBasis="50%" >
        <code>{message.id}</code>
        <Typography>{message.defaultMessage}</Typography>
      </Box>
      <Box flexBasis="50%">
        <Textarea value="" minRows={2} />
      </Box>
    </Box>
  );
};

export default MessageForm;
