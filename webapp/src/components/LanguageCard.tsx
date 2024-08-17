'use client';

import { FC } from 'react';
import { Box, LinearProgress, Link, Typography, useTheme } from '@mui/material';

export type LanguageCardProps = {
  /**
   * The URL of the page containing the project's messages in this language.
   */

  href: string;

  /**
   * The name of the language.
   */
  language: string;

  /**
   * The number of messages left to translate in this language.
   */
  messagesLeft: number;

  /**
   * The percentage of messages translated in this language. 0 means none, 100
   * means all of them.
   */
  progress: number;
};

/**
 * A language card can be clicked to navigate to the page containing all a
 * project's messages in that language. It display's the name of the language
 * and some brief statistics about how complete the translation is.
 */
const LanguageCard: FC<LanguageCardProps> = ({
  href,
  language,
  messagesLeft,
  progress,
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
                textDecoration: 'none',
              },
              color: 'inherit',
              position: 'inherit',
            }}
          >
            {language}
          </Link>
          <LinearProgress
            sx={{ backgroundColor: '#ffffff' }}
            value={Math.min(progress, 100)}
            variant="determinate"
          />
        </Typography>

        <Typography>{messagesLeft} messages to translate</Typography>
      </Box>
    </Box>
  );
};

export default LanguageCard;
