'use client';

import { FC } from 'react';
import { Box, Typography } from '@mui/material';

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
      {text.split(new RegExp(`(${query})`, 'gi')).map((part, i) => (
        <Typography
          key={`${part}-${i}`}
          color={part === query ? 'text.primary' : 'text.secondary'}
          component="span"
          sx={{
            backgroundColor: part === query ? 'yellow' : 'transparent',
          }}
        >
          {part}
        </Typography>
      ))}
    </Box>
  );
};

export default HighlightSearchQuery;
