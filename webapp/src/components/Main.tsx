'use client';

import { useTheme } from '@mui/material';
import Box from '@mui/material/Box';
import { FC, ReactNode } from 'react';

type MainProps = {
  children: ReactNode;
};

const Main: FC<MainProps> = ({ children }) => {
  const theme = useTheme();
  return (
    <Box
      component="main"
      sx={{
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        marginTop: 6,
        [theme.breakpoints.up('md')]: {
          marginTop: 0,
        },
      }}
    >
      {children}
    </Box>
  );
};

export default Main;
