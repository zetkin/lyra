'use client';

import { FC } from 'react';
import { Box, LinearProgress, Link, Typography, useTheme } from '@mui/material';

import { Project } from '@/api/generated';
import LanguageCard from '@/components/LanguageCard';
/**
 * Project cards are the primary navigation element on the home screen. They
 * display information about the project, and clicking them takes the user to
 * the project page.
 *
 * Displaying a collection of structured information like this in a clickable
 * card introduces some accessibility challenges. The implementation here
 * employs the [Inclusive Components "pseudo-content trick"](https://inclusive-components.design/cards/).
 *
 */
const ProjectCard: FC<Project> = (project: Project) => {
  const theme = useTheme();

  return (
    <Box component="li" sx={{ listStyleType: 'none' }} width="100%">
      <Box
        sx={{
          ':focus-within, :hover': {
            outlineColor: theme.palette.primary.main,
            outlineStyle: 'solid',
            outlineWidth: 1,
          },
          backgroundColor: '#fafcfe',
          borderRadius: 2,
          boxShadow: 'none',
          display: 'flex',
          flexDirection: 'column',
          outlineColor: theme.palette.primary.main,
          paddingBottom: theme.spacing(2),
          paddingLeft: theme.spacing(3),
          paddingRight: theme.spacing(3),
          paddingTop: theme.spacing(2),
          position: 'relative',
          rowGap: theme.spacing(1),
        }}
      >
        <Typography component="h2" fontWeight="bold">
          <Link
            href={`/repositories/${project.repository}/projects/${project.id}`}
            sx={{
              '::after': {
                bottom: 0,
                content: '""',
                left: 0,
                position: 'absolute',
                right: 0,
                top: 0,
                width: '100%',
              },
              ':hover, :focus': {
                outline: 'none',
              },
              color: 'inherit',
              position: 'inherit',
              textDecoration: 'none',
            }}
          >
            {project.repository}/{project.projectPath}{' '}
            {project.projectPath === '.' && '(repository root)'}
          </Link>
          <Typography>Messages: {project.messageCount}</Typography>
        </Typography>
        <Box
          columnGap={1}
          component="ul"
          display="grid"
          margin={0}
          padding={0}
          rowGap={1}
          sx={{
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr));',
            width: '100%',
          }}
        >
          {Object.entries(project.supportedLanguages).map(
            ([lang, langDetails]) => (
              <LanguageCard
                key={lang}
                details={langDetails}
                languageKey={lang}
                projectId={project.id}
                repositoryName={project.repository}
                totalMessages={project.messageCount ?? 0}
              />
            ),
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default ProjectCard;
