'use client';

import { Roboto } from 'next/font/google';
import NextLink from 'next/link';
import { createTheme } from '@mui/material/styles';
import { ForwardedRef, forwardRef } from 'react';

const roboto = Roboto({
  display: 'swap',
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
});

const LinkBehaviour = forwardRef(function LinkBehaviour(
  props: { href: string },
  ref: ForwardedRef<HTMLAnchorElement>,
) {
  return <NextLink ref={ref} {...props} />;
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
    MuiButton: {
      defaultProps: {
        LinkComponent: LinkBehaviour,
      },
      styleOverrides: {
        root: () => ({
          ':disabled': {
            color: '#666',
          },
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
    MuiLink: {
      defaultProps: {
        component: LinkBehaviour,
      },
    },
  },

  typography: {
    fontFamily: roboto.style.fontFamily,
  },
});

export default theme;
