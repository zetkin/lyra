'use client';

import { Roboto } from 'next/font/google';
import { createTheme } from '@mui/material/styles';

const roboto = Roboto({
  display: 'swap',
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
});

const theme = createTheme({
  components: {
    MuiCard: {
      styleOverrides: {
        root: ({ theme }) => ({
          ':focus-within, :hover': {
            outlineColor: theme.palette.primary.main,
            outlineStyle: 'solid',
            outlineWidth: 1,
          },
          backgroundColor: '#fafcfe',
          borderRadius: 2,
          boxShadow: 'none',
          display: 'flex',
          flexDirection: 'column',
          outlineColor: theme.palette.primary.main,
          paddingBottom: theme.spacing(2),
          paddingLeft: theme.spacing(1),
          paddingRight: theme.spacing(1),
          paddingTop: theme.spacing(2),
          position: 'relative',
          rowGap: theme.spacing(1),
        }),
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: () => ({
          border: '1px solid',
          borderColor: '#87b6ed',
          borderRadius: 4,
          height: 8,
        }),
      },
    },
  },

  typography: {
    fontFamily: roboto.style.fontFamily,
  },
});

export default theme;
