'use client';

import { FC } from 'react';
import GlobalStyles from '@mui/material/GlobalStyles';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import Paper from '@mui/material/Paper';

import { toggleSidebar } from '../utils/sidebar';

const Header: FC = () => {
  return (
    <Paper
      sx={{
        alignItems: 'center',
        borderBottom: 1,
        boxShadow: 1,
        display: { md: 'none', xs: 'flex' },
        gap: 1,
        height: 'var(--Header-height)',
        justifyContent: 'flex-end',
        p: 2,
        position: 'fixed',
        top: 0,
        width: '100vw',
        zIndex: 9995,
      }}
    >
      <GlobalStyles
        styles={(theme) => ({
          ':root': {
            '--Header-height': '52px',
            [theme.breakpoints.up('md')]: {
              '--Header-height': '0px',
            },
          },
        })}
      />
      <IconButton
        aria-label="Menu"
        color="primary"
        onClick={() => toggleSidebar()}
        size="small"
      >
        <MenuIcon />
      </IconButton>
    </Paper>
  );
};

export default Header;