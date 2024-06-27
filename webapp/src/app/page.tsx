'use client';

import { CardGrid } from '@/components/CardGrid';
import ProjectCard from '@/components/ProjectCard';
import { ProjectItem } from '@/types';
import { Box, CircularProgress, Typography } from '@mui/joy';
import { useEffect, useState } from 'react';

type HomeState = {
  loaded: boolean;
  projects: ProjectItem[];
};

export default function Home() {
  const [{ loaded, projects }, setState] = useState<HomeState>({
    loaded: false,
    projects: [],
  });

  useEffect(() => {
    fetch('/api/projects')
      .then((res) => res.json())
      .then((data) => setState({ loaded: true, projects: data.projects }));
  }, []);

  if (!loaded) {
    return (
      <Box
        display="grid"
        height="calc(100vh - 2rem)"
        sx={{ placeItems: 'center' }}
        width="calc(100vw - 2rem)"
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
    >
      <CardGrid
        heading={
          <>
            <Typography alignSelf="flex-start" component="h1">
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
}
