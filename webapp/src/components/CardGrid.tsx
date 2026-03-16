import { Box, List } from '@mui/material';
import { FC, ReactNode } from 'react';
import React from 'react';

export type CardGridProps = {
  children: ReactNode;
  heading?: ReactNode;
};

export const CardGrid: FC<CardGridProps> = ({ children, heading }) => {
  const count = React.Children.count(children);
  const cols = (max: number) => Math.min(count, max);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        rowGap: 2,
        width: '100%',
      }}
    >
      {heading && <Box>{heading}</Box>}
      <List
        sx={{
          '@media (min-width: 650px)': {
            gridTemplateColumns: `repeat(${cols(2)}, minmax(280px, 1fr))`,
          },
          '@media (min-width: 950px)': {
            gridTemplateColumns: `repeat(${cols(3)}, minmax(280px, 1fr))`,
          },
          columnGap: 2,
          display: 'grid',
          gridTemplateColumns: `repeat(${cols(1)}, minmax(280px, 1fr))`,
          rowGap: 2,
          width: '100%',
        }}
      >
        {children}
      </List>
    </Box>
  );
};
