import { FC } from 'react';
import { Box, Typography } from '@mui/material';

import { CardGrid } from '@/components/CardGrid';
import ProjectCard, { ProjectCardProps } from '@/components/ProjectCard';

type HomeDashboardProps = {
  projects: ProjectCardProps[];
};

const HomeDashboard: FC<HomeDashboardProps> = ({ projects }) => {
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
