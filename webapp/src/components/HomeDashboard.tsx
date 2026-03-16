'use client';

import { FC, useEffect, useState } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

import { CardGrid } from '@/components/CardGrid';
import ProjectCard from '@/components/ProjectCard';
import { useRepoStore } from '@/store/repoStore';
import { useProjectStore } from '@/store/ProjectStore';

const HomeDashboard: FC = () => {
  const [loadingState, setLoadingState] = useState<'loading' | 'ready'>(
    'loading',
  );
  const fetchAllRepos = useRepoStore((state) => state.fetchAllRepos);
  const fetchAllProjects = useProjectStore((state) => state.fetchAllProjects);
  const projects = useProjectStore((state) => state.projects);

  useEffect(() => {
    fetchAllRepos().then(() => {
      const { repos } = useRepoStore.getState();
      Promise.all(
        repos.map((repo) => fetchAllProjects(repo.name)),
      ).then(() => setLoadingState('ready'));
    });
  }, [fetchAllRepos, fetchAllProjects]);

  if (loadingState === 'loading') {
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
      maxWidth="1100px"
      minHeight="97vh"
      mx="auto"
      p={2}
      width="100%"
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
