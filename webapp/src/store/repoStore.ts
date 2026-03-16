import { create } from 'zustand';

import { Repo } from '@/api/generated';
import { api } from '@/api';

type RepoState = {
  fetchAllRepos: () => Promise<void>;
  findRepo: (repoName: string) => Promise<Repo | undefined>;
  // eslint-disable-next-line @typescript-eslint/member-ordering
  fetched: boolean;
  repos: Repo[];
};

export const useRepoStore = create<RepoState>((set, get) => ({
  fetchAllRepos: async () => {
    if (get().fetched) {
      return;
    }
    set({ fetched: true });
    const repos = await api.getRepositories();
    set({ repos });
  },
  findRepo: async (repoName: string) => {
    if (!get().fetched) {
      await get().fetchAllRepos();
    }
    return get().repos.find((repo) => repo.name === repoName);
  },
  // eslint-disable-next-line sort-keys
  fetched: false,
  repos: [],
}));
