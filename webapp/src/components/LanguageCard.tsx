import { FC } from 'react';
import { Box, LinearProgress, Link, Typography } from '@mui/material';

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
        px={1}
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
            {language}
          </Link>
          <LinearProgress
            determinate
            size="lg"
            sx={{ backgroundColor: '#ffffff' }}
            thickness={8}
            value={Math.min(progress, 100)}
            variant="outlined"
          />{' '}
        </Typography>

        <Typography>{messagesLeft} messages to translate</Typography>
      </Box>
    </Box>
  );
};

export default LanguageCard;
