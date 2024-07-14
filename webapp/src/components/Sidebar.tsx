'use client';

import { Box, useTheme } from '@mui/material';
import GlobalStyles from '@mui/material/GlobalStyles';
import { FocusTrap } from '@mui/base/FocusTrap';
import Paper from '@mui/material/Paper';
import { FC, ReactNode, useContext } from 'react';

import SidebarOverlay from '@/components/SidebarOverlay';
import { SidebarContext } from './SidebarContext';

type SidebarProps = {
  children: ReactNode;
};

const Sidebar: FC<SidebarProps> = ({ children }) => {
  const theme = useTheme();
  const { isSidebarOpen } = useContext(SidebarContext);

  return (
    <FocusTrap
      open={
        isSidebarOpen &&
        typeof window !== 'undefined' &&
        window.innerWidth < theme.breakpoints.values.md
      }
    >
      <Paper
        sx={{
          borderColor: 'divider',
          borderRight: '1px solid',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          gap: 2,
          height: '100dvh',
          position: { md: 'sticky', xs: 'fixed' },
          top: 0,
          transform: {
            md: 'none',
            xs: 'translateX(calc(100% * (var(--SideNavigation-slideIn, 0) - 1)))',
          },
          transition: 'transform 0.4s, width 0.4s',
          width: 'var(--Sidebar-width)',
          zIndex: 10000,
        }}
      >
        <GlobalStyles
          styles={(theme) => ({
            ':root': {
              '--Sidebar-width': '220px',
              [theme.breakpoints.up('lg')]: {
                '--Sidebar-width': '240px',
              },
            },
          })}
        />
        <SidebarOverlay />
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            p: 2,
            rowGap: theme.spacing(2),
          }}
        >
          {children}
        </Box>
      </Paper>
    </FocusTrap>
  );
};

export default Sidebar;
