'use client';

import { FC, useEffect, useCallback } from 'react';
import GlobalStyles from '@mui/material/GlobalStyles';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import Paper from '@mui/material/Paper';

import { isSidebarOpen, toggleSidebar } from '@/utils/sidebar';

const Header: FC = () => {
  const onResize = useCallback(() => {
    if (window.innerWidth >= 960 && isSidebarOpen()) {
      document.documentElement.style.removeProperty('--SideNavigation-slideIn');
      document.body.style.removeProperty('overflow');
    }
  }, []);

  useEffect(() => {
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
    };
  }, [onResize]);

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
