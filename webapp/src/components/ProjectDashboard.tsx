'use client';

import { FC } from 'react';
import Link from 'next/link';
import { Box, Typography } from '@mui/material';

import { CardGrid } from '@/components/CardGrid';
import LanguageCard, { LanguageCardProps } from '@/components/LanguageCard';
import HomeIcon from '@/components/HomeIcon';

type ProjectDashboardProps = {
  languages: LanguageCardProps[];
  messageCount: number;
  project: string;
};

const ProjectDashboard: FC<ProjectDashboardProps> = ({
  languages,
  messageCount,
  project,
}) => {
  return (
    <Box
      alignItems="center"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      minHeight="97vh"
      rowGap={2}
    >
      <Box
        alignItems="center"
        columnGap={1}
        display="flex"
        flexDirection="row"
        px={2}
        py={2}
        width="100%"
      >
        <Link href="/">
          <HomeIcon />
        </Link>
      </Box>
      <Box
        sx={{
          alignItems: 'center',
          display: 'flex',
          flex: 1,
          flexDirection: 'column',
          justifyContent: 'center',
          width: '100%',
        }}
      >
        <CardGrid
          heading={
            <>
              <Typography component="h1" fontWeight="bold">
                {project}
              </Typography>
              <Typography>{messageCount} messages</Typography>
            </>
          }
        >
          {languages.map((language, i) => (
            <LanguageCard key={i} {...language} />
          ))}
        </CardGrid>
      </Box>
    </Box>
  );
};

export default ProjectDashboard;
