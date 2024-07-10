'use client';

import { FC } from 'react';
import { Box, LinearProgress, Link, Typography, useTheme } from '@mui/material';

export type ProjectCardProps = {
  /**
   * The URL of the project page.
   */
  href: string;

  /**
   * The project's languages and their translation progress.
   */
  languages: {
    /**
     * The URL of the page containing the project's messages in this language.
     */

    href: string;

    /**
     * The name of the language.
     */
    language: string;

    /**
     * The percentage of messages translated in this language. 0 means none, 100
     * means all of them.
     */
    progress: number;
  }[];

  /**
   * The number of messages in the project.
   */
  messageCount: number;

  /**
   * The name of the project.
   */
  name: string;
};

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
const ProjectCard: FC<ProjectCardProps> = ({
  href,
  languages,
  name,
  messageCount,
}) => {
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
            href={href}
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
            {name}
          </Link>
        </Typography>
        <Typography>{messageCount} messages</Typography>
        <Box
          columnGap={1}
          component="ul"
          display="grid"
          margin={0}
          padding={0}
          rowGap={1}
          sx={{
            gridTemplateColumns: 'repeat(auto-fit, minmax(30px, 120px));',
            width: '100%',
          }}
        >
          {languages.map(({ href, language, progress }) => (
            <Box
              key={language}
              bgcolor="#e9f3fd"
              borderRadius={2}
              component="li"
              position="relative"
              sx={{
                ':focus-within, :hover': {
                  outlineColor: theme.palette.primary.main,
                  outlineStyle: 'solid',
                  outlineWidth: 1,
                },
                listStyleType: 'none',
              }}
            >
              <Box display="flex" flexDirection="column" px={3} py={2}>
                <Link
                  href={href}
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
                    position: 'inherit',
                    textDecoration: 'none',
                  }}
                >
                  {language}
                </Link>
                <LinearProgress
                  sx={{ backgroundColor: '#ffffff' }}
                  value={Math.min(progress, 100)}
                  variant="determinate"
                />
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default ProjectCard;
