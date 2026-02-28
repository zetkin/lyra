'use client';

import { FC, useEffect, useState } from 'react';
import Link from 'next/link';
import ErrorIcon from '@mui/icons-material/Error';
import { Box, CircularProgress, Typography } from '@mui/material';

import { CardGrid } from '@/components/CardGrid';
import LanguageCard from '@/components/LanguageCard';
import HomeIcon from '@/components/HomeIcon';
import { ProjectResponse } from '@/app/api/projects/[projectName]/route';

type ProjectDashboardProps = {
  projectName: string;
};

type ProjectLoadingState = {
  project: undefined;
  status: 'loading';
};

type ProjectNotFoundState = {
  project: undefined;
  status: 'not-found';
};

type ProjectReadyState = {
  project: ProjectResponse;
  status: 'ready';
};

type ProjectState =
  | ProjectLoadingState
  | ProjectNotFoundState
  | ProjectReadyState;

const ProjectDashboard: FC<ProjectDashboardProps> = ({ projectName }) => {
  const [state, setProjectState] = useState<ProjectState>({
    project: undefined,
    status: 'loading',
  });

  useEffect(() => {
    fetch(`/api/projects/${projectName}`)
      .then((r) => r.json())
      .then((p) => {
        if (p.errorMessage) {
          setProjectState({
            project: undefined,
            status: 'not-found',
          });
          return;
        }
        setProjectState({
          project: p,
          status: 'ready',
        });
      });
  }, [projectName]);

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
        <>
          {state.status === 'loading' && <CircularProgress />}
          {state.status === 'not-found' && (
            <>
              <ErrorIcon />
              <Typography component="h1" fontWeight="bold">
                Not Found
              </Typography>
            </>
          )}
          {state.status === 'ready' && (
            <>
              <CardGrid
                heading={
                  <>
                    <Typography component="h1" fontWeight="bold">
                      {projectName}
                    </Typography>
                    <Typography>
                      {state.project.messageCount} messages
                    </Typography>
                  </>
                }
              >
                {state.project.languages.map((language, i) => (
                  <LanguageCard key={i} {...language} />
                ))}
              </CardGrid>
            </>
          )}
        </>
      </Box>
    </Box>
  );
};

export default ProjectDashboard;
