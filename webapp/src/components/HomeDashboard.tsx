'use client';

import { FC, useEffect, useState } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

import { CardGrid } from '@/components/CardGrid';
import ProjectCard, { ProjectCardProps } from '@/components/ProjectCard';

const HomeDashboard: FC = () => {
  const [projects, setProjects] = useState<ProjectCardProps>([]);
  const [status, setStatus] = useState<'loading' | 'ready'>('loading');

  useEffect(() => {
    fetch('/api/projects')
      .then((r) => r.json())
      .then((p) => {
        setProjects(p);
        setStatus('ready');
      });
  }, []);

  if (status === 'loading') {
    return (
      <Box
        alignItems="center"
        display="flex"
        flexDirection="column"
        justifyContent="center"
        minHeight="97vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      alignItems="center"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      minHeight="97vh"
      p={2}
    >
      <CardGrid
        heading={
          <>
            <Typography alignSelf="flex-start" component="h1" fontWeight="bold">
              Your Lyra Projects
            </Typography>
          </>
        }
      >
        {projects.map((project, i) => (
          <ProjectCard key={i} {...project} />
        ))}
      </CardGrid>
    </Box>
  );
};

export default HomeDashboard;
