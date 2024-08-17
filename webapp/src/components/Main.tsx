import Box from '@mui/material/Box';
import { FC, ReactNode } from 'react';

type MainProps = {
  children: ReactNode;
};

const Main: FC<MainProps> = ({ children }) => {
  return (
    <Box
      component="main"
      display="flex"
      flex={1}
      flexDirection="column"
      height="calc(100dvh - var(--Header-height))"
      marginTop="var(--Header-height)"
      overflow="hidden"
    >
      {children}
    </Box>
  );
};

export default Main;
