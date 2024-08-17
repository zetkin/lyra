import { Box, List } from '@mui/material';
import { FC, ReactNode } from 'react';

export type CardGridProps = {
  children: ReactNode;
  heading?: ReactNode;
};

export const CardGrid: FC<CardGridProps> = ({ children, heading }) => {
  return (
    <Box
      sx={{
        '@media (min-width: 600px)': {
          maxWidth: '900px',
        },
        display: 'flex',
        flexDirection: 'column',
        maxWidth: '600px',
        rowGap: 2,
        width: '100%',
      }}
    >
      {heading && <Box>{heading}</Box>}
      <List
        sx={{
          '@media (min-width: 650px)': {
            columnGap: 2,
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 300px);',
          },
          '@media (min-width: 950px)': {
            gridTemplateColumns: 'repeat(3, 300px);',
          },
          display: 'flex',
          flexDirection: 'column',
          rowGap: 2,
          width: '100%',
        }}
      >
        {children}
      </List>
    </Box>
  );
};
