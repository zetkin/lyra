'use client';

import { createContext, FC, ReactNode } from 'react';

export type SearchIdleState = {
  query: '';
  status: 'idle';
};

export type SearchBusyState = {
  query: string;
  status: 'busy';
};

export type SearchState = SearchIdleState | SearchBusyState;

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
