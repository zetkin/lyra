import { FC } from 'react';
import { Box, List, Typography } from '@mui/joy';
import ProjectCard, { ProjectCardProps } from './ProjectCard';

type HomeDashboardProps = {
  projects: ProjectCardProps[];
};

/**
 */
const HomeDashboard: FC<HomeDashboardProps> = ({ projects }) => {
  return (
    <Box
      alignItems="center"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      minHeight="97vh"
    >
      <Typography alignSelf="flex-start" color="primary" component="h1">
        Your Lyra Projects
      </Typography>
      <List
        sx={{
          '@media (min-width: 600px)': {
            alignContent: 'center',
            columnGap: 2,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 300px));',
            justifyContent: 'center',
          },
          alignItems: 'center',
          display: 'flex',
          flex: 1,
          flexDirection: 'column',
          rowGap: 2,
          width: '100%',
        }}
      >
        {projects.map((project, i) => (
          <ProjectCard key={i} {...project} />
        ))}
      </List>
    </Box>
  );
};

export default HomeDashboard;
