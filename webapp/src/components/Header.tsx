'use client';

import { FC } from 'react';
import GlobalStyles from '@mui/joy/GlobalStyles';
import IconButton from '@mui/joy/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import Sheet from '@mui/joy/Sheet';

import { toggleSidebar } from '../utils/sidebar';

type HeaderProps = {
  //
};

const Header: FC<HeaderProps> = () => {
  return (
    <Sheet
      sx={{
        alignItems: 'center',
        borderBottom: '1px solid',
        borderColor: 'background.level1',
        boxShadow: 'sm',
        display: { md: 'none', xs: 'flex' },
        gap: 1,
        height: 'var(--Header-height)',
        justifyContent: 'space-between',
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
        color="neutral"
        onClick={() => toggleSidebar()}
        size="sm"
        variant="outlined"
      >
        <MenuIcon />
      </IconButton>
    </Sheet>
  );
};

export default Header;
