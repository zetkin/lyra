'use client';

import Box from '@mui/material/Box';
import { FC, ReactNode } from 'react';

type MainProps = {
  children: ReactNode;
};

const Main: FC<MainProps> = ({ children }) => {
  return (
    <Box
      component="main"
      sx={{
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        marginTop: 6,
      }}
    >
      {children}
    </Box>
  );
};

export default Main;
