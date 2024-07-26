'use client';

import { FC, useEffect, useCallback, useContext } from 'react';
import { Box, GlobalStyles, IconButton, useTheme } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';

import { SidebarContext } from './SidebarContext';
import Breadcrumbs from './Breadcrumbs';

type HeaderProps = {
  languageName: string;
  messageId?: string;
  projectName: string;
};

const Header: FC<HeaderProps> = ({ languageName, messageId, projectName }) => {
  const theme = useTheme();
  const { isSidebarOpen, setIsSidebarOpen } = useContext(SidebarContext);
  const onResize = useCallback(() => {
    if (window.innerWidth >= 960 && isSidebarOpen) {
      setIsSidebarOpen(false);
    }
  }, [isSidebarOpen, setIsSidebarOpen]);

  useEffect(() => {
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
    };
  }, [onResize]);

  return (
    <Box
      sx={{
        alignItems: 'center',
        borderBottom: 1,
        boxShadow: 1,
        display: 'flex',
        flexDirection: 'row',
        gap: 1,
        height: 'var(--Header-height)',
        justifyContent: 'space-between',
        position: 'fixed',
        px: 2,
        top: 0,
        width: '100vw',
        zIndex: 9995,
        [theme.breakpoints.up('md')]: {
          marginLeft: 'var(--Sidebar-width)',
          width: 'calc(100vw - var(--Sidebar-width))',
        },
      }}
    >
      <GlobalStyles
        styles={{
          ':root': {
            '--Header-height': '52px',
          },
        }}
      />
      <Breadcrumbs
        languageName={languageName}
        messageId={messageId}
        projectName={projectName}
      />
      <IconButton
        aria-label="Menu"
        color="primary"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        size="small"
        sx={{
          display: { md: 'none', xs: 'flex' },
        }}
      >
        <MenuIcon />
      </IconButton>
    </Box>
  );
};

export default Header;
