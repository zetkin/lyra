'use client';

import { FC, useEffect, useState } from 'react';
import Link from 'next/link';
import ErrorIcon from '@mui/icons-material/Error';
import { Box, CircularProgress, Typography } from '@mui/material';

import HomeIcon from '@/components/HomeIcon';
import { error } from '@/utils/log';
import { useProjectStore } from '@/store/ProjectStore';
import { Project } from '@/api/generated';
import ProjectCard from '@/components/ProjectCard';
type ProjectDashboardProps = {
  projectId: number;
  repositoryName: string;
};

type ProjectState =
  | { status: 'loading' }
  | { project: Project; status: 'ready' }
  | { status: 'not-found' };

const ProjectDashboard: FC<ProjectDashboardProps> = ({
  projectId,
  repositoryName,
}) => {
  const [state, setProjectState] = useState<ProjectState>({
    status: 'loading',
  });
  const projectStore = useProjectStore();

  useEffect(() => {
    projectStore.findProject(repositoryName, projectId).then((project) => {
      if (project) {
        return setProjectState({ project, status: 'ready' });
      }
      setProjectState({ status: 'not-found' });
      error(`Project for ${repositoryName}/${projectId} not found`);
    });
  }, [projectId, repositoryName, projectStore]);

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
          maxWidth: '1100px',
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
          {state.status === 'ready' && <ProjectCard {...state.project} />}
        </>
      </Box>
    </Box>
  );
};

export default ProjectDashboard;
