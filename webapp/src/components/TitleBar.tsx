'use client';

import { Box, Typography, useTheme } from '@mui/material';
import Link from 'next/link';
import { FC } from 'react';

import HomeIcon from '@/components/HomeIcon';
import { langToFlagEmoji } from '@/utils/stringUtils';

type TitleBarProps = {
  languageName: string;
  projectId: number;
  repositoryName: string;
};

const TitleBar: FC<TitleBarProps> = ({
  languageName,
  projectId,
  repositoryName,
}) => {
  const theme = useTheme();
  return (
    <Box
      px={2}
      py={2}
      sx={{
        alignItems: 'center',
        borderBottom: '1px solid #c3c7cc',
        columnGap: theme.spacing(1),
        display: 'flex',
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
        <Box component="span">
          {repositoryName}/{projectId}
        </Box>
        <Box component="span">
          {langToFlagEmoji(languageName)} {languageName}
        </Box>
      </Typography>
    </Box>
  );
};

export default TitleBar;
