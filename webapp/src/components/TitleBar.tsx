'use client';

import { Box, Typography, useTheme } from '@mui/material';
import Link from 'next/link';
import { FC } from 'react';

import HomeIcon from '@/components/HomeIcon';

type TitleBarProps = {
  languageName: string;
  projectName: string;
};

const TitleBar: FC<TitleBarProps> = ({ languageName, projectName }) => {
  const theme = useTheme();
  return (
    <Box
      sx={{
        alignItems: 'center',
        borderBottom: '1px solid #c3c7cc',
        columnGap: theme.spacing(1),
        display: 'flex',
        paddingBottom: theme.spacing(2),
        paddingTop: theme.spacing(1),
      }}
    >
      <Link
        href="/"
        style={{
          alignItems: 'center',
          columnGap: theme.spacing(1),
          display: 'flex',
        }}
      >
        <HomeIcon />
      </Link>
      <Typography
        color="primary"
        component="h1"
        fontWeight="bold"
        sx={{
          display: 'flex',
          flex: 1,
          justifyContent: 'space-between',
        }}
      >
        <Box component="span">{projectName}</Box>
        <Box component="span">{languageName}</Box>
      </Typography>
    </Box>
  );
};

export default TitleBar;
