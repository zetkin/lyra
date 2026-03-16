'use client';

import { FC } from 'react';
import { Box, Typography } from '@mui/material';

import { splitTextOnQuery, textMatchesQuery } from '@/utils/searchUtils';

type HighlightSearchQueryProps = {
  query: string;
  text: string;
};

const HighlightSearchQuery: FC<HighlightSearchQueryProps> = ({
  query,
  text,
}) => {
  return (
    <Box>
      {splitTextOnQuery(text, query).map((part, i) => (
        <Typography
          key={`${part}-${i}`}
          color={
            textMatchesQuery(part, query) ? 'text.primary' : 'text.secondary'
          }
          component="span"
          sx={{
            backgroundColor: textMatchesQuery(part, query)
              ? 'yellow'
              : 'transparent',
          }}
        >
          {part}
        </Typography>
      ))}
    </Box>
  );
};

export default HighlightSearchQuery;
