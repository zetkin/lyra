'use client';
import Box from '@mui/joy/Box';
import { FC } from 'react';
import GlobalStyles from '@mui/joy/GlobalStyles';
import Sheet from '@mui/joy/Sheet';
import Typography from '@mui/joy/Typography';

import SidebarOverlay from './SidebarOverlay';

type SidebarProps = {
  //
};

const Sidebar: FC<SidebarProps> = () => {
  return (
    <Sheet
      className="Sidebar"
      sx={{
        borderColor: 'divider',
        borderRight: '1px solid',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        gap: 2,
        height: '100dvh',
        p: 2,
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
      <Box sx={{ alignItems: 'center', display: 'flex', gap: 1 }}>
        <Typography level="title-lg">Acme Co.</Typography>
      </Box>
    </Sheet>
  );
};

export default Sidebar;
