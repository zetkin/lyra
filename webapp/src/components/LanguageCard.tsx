'use client';

import { FC } from 'react';
import { Box, Link, LinearProgress, Typography, useTheme } from '@mui/material';

import { LanguageDetails } from '@/api/generated';
import { langToFlagEmoji } from '@/utils/stringUtils';

export type LanguageCardProps = {
  details: LanguageDetails;
  languageKey: string;
  projectId: number;
  repositoryName: string;
  totalMessages: number;
};

/**
 * A language card can be clicked to navigate to the page containing all a
 * project's messages in that language. It display's the name of the language
 * and some brief statistics about how complete the translation is.
 */
const LanguageCard: FC<LanguageCardProps> = ({
  details,
  languageKey,
  projectId,
  repositoryName,
  totalMessages,
}) => {
  const theme = useTheme();
  const messagesLeft = totalMessages - details.amountTranslations;
  const progress = (100.0 * details.amountTranslations) / totalMessages;
  return (
    <Box
      component="li"
      sx={{ height: '300px', listStyleType: 'none' }}
      width="100%"
    >
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
        <Link
          href={`/repositories/${repositoryName}/projects/${projectId}/${languageKey}`}
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
            height: '3em',
            overflow: 'hidden',
            position: 'inherit',
          }}
        >
          <Typography component="h2" fontWeight="bold" fontSize={17}>
            {langToFlagEmoji(languageKey)} {details.name} ({languageKey})
          </Typography>
        </Link>
        <Box sx={{ flexGrow: 1 }} />
        <LinearProgress
          sx={{ backgroundColor: '#ffffff' }}
          value={Math.min(progress, 100)}
          variant="determinate"
        />
        <Typography color="text.secondary" variant="body2">
          {messagesLeft} messages to translate ({(100 - progress).toFixed(0)}%)
        </Typography>
      </Box>
    </Box>
  );
};

export default LanguageCard;
