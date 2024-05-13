import { FC } from 'react';
import { Box, LinearProgress, Link, Typography } from '@mui/joy';

export type ProjectCardProps = {
  /**
   * The URL of the project page.
   */
  href: string;

  /**
   * The project's languages and their translation progress.
   */
  languages: {
    href: string;
    language: string;
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
  return (
    <Box component="li" sx={{ listStyleType: 'none' }} width="100%">
      <Box
        bgcolor="neutral.50"
        border={1}
        borderColor="transparent"
        borderRadius={8}
        display="flex"
        flexDirection="column"
        position="relative"
        px={3}
        py={2}
        rowGap={1}
        sx={{
          ':focus-within, :hover': {
            outlineColor: 'focusVisible',
            outlineStyle: 'solid',
            outlineWidth: 1,
          },
        }}
      >
        <Typography component="h2">
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
                textDecoration: 'none',
              },
              color: 'inherit',
              position: 'inherit',
            }}
          >
            {name}
          </Link>
        </Typography>
        <Typography>{messageCount} messages</Typography>
        <Box
          columnGap={1}
          component="ul"
          display="flex"
          flexWrap="wrap"
          margin={0}
          padding={0}
          rowGap={1}
        >
          {languages.map(({ href, language, progress }) => (
            <Box
              key={language}
              bgcolor="primary.50"
              borderRadius={4}
              component="li"
              position="relative"
              sx={{
                ':focus-within, :hover': {
                  outlineColor: 'focusVisible',
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
                      textDecoration: 'none',
                    },
                    position: 'inherit',
                  }}
                >
                  {language}
                </Link>
                <LinearProgress determinate value={progress} />
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default ProjectCard;
