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
    MuiBreadcrumbs: {
      styleOverrides: {
        ol: () => ({
          flexWrap: 'nowrap',
          justifyContent: 'flex-end',
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
