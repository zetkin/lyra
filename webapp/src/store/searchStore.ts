import { create } from 'zustand';

export type SearchStatus = 'busy' | 'idle';

type SearchState = {
  isBusy: () => boolean;
  isIdle: () => boolean;
  resetQuery: () => void;
  setQuery: (query: string) => void;
  setStatus: (status: SearchStatus) => void;
  textIncludesQuery: (text: string) => boolean;
  // eslint-disable-next-line @typescript-eslint/member-ordering
  query: string;
  status: SearchStatus;
};
export const useSearchStore = create<SearchState>((set, get) => ({
  isBusy: () => get().status === 'busy',
  isIdle: () => get().status === 'idle',
  resetQuery: () => get().setQuery(''),
  setQuery: (query: string) =>
    set((state) => {
      state.query = query;
      return state;
    }),
  setStatus: (status: SearchStatus) =>
    set((state) => {
      state.status = status;
      return state;
    }),
  textIncludesQuery: (text: string) =>
    text.toLocaleLowerCase().includes(get().query.toLocaleLowerCase()),
  // eslint-disable-next-line sort-keys
  query: '',
  status: 'idle',
}));
