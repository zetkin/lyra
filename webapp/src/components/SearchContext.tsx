'use client';

import { createContext, FC, ReactNode } from 'react';

export type SearchState = {
  query: string;
  status: 'idle' | 'busy';
};

export const SearchContext = createContext<SearchState>({
  query: '',
  status: 'idle',
});

const SearchContextProvider: FC<{
  children: ReactNode;
  value: SearchState;
}> = ({ children, value }) => {
  return (
    <SearchContext.Provider value={value}>{children}</SearchContext.Provider>
  );
};

export default SearchContextProvider;
