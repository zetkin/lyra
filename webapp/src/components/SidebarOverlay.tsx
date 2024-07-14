'use client';
import Box from '@mui/material/Box';
import { FC, useContext } from 'react';

import { SidebarContext } from './SidebarContext';

const SidebarOverlay: FC = () => {
  const { setIsSidebarOpen } = useContext(SidebarContext);
  return (
    <Box
      onClick={() => setIsSidebarOpen(false)}
      sx={{
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        height: '100vh',
        left: 0,
        opacity: 'var(--SideNavigation-slideIn)',
        position: 'fixed',
        top: 0,
        transform: {
          lg: 'translateX(-100%)',
          xs: 'translateX(calc(100% * (var(--SideNavigation-slideIn, 0) - 1) + var(--SideNavigation-slideIn, 0) * var(--Sidebar-width, 0px)))',
        },
        transition: 'opacity 0.4s',
        width: '100vw',
        zIndex: 9998,
      }}
    />
  );
};

export default SidebarOverlay;
