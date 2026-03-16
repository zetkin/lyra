import { create } from 'zustand';

import { Project } from '@/api/generated';
import { api } from '@/api';

type ProjectState = {
  addProject(project: Project): void;
  addProjects(projects: Project[]): void;
  fetchAllProjects: (repoName: string) => Promise<void>;
  findProject: (
    repoName: string,
    projectId: number,
  ) => Promise<Project | undefined>;
  // eslint-disable-next-line @typescript-eslint/member-ordering
  fetched: boolean;
  projects: Project[];
};

export const useProjectStore = create<ProjectState>((set, get) => ({
  addProject: (project: Project) => {
    if (
      get().projects.find(
        (p) => p.repository === project.repository && p.id === project.id,
      )
    ) {
      return;
    }
    set((state) => ({
      ...state,
      projects: [...state.projects, project],
    }));
  },
  addProjects: (projects: Project[]) => {
    projects.forEach((project) => get().addProject(project));
  },
  fetchAllProjects: async (repositoryName: string) => {
    if (get().fetched) {
      return;
    }
    set({ fetched: true });
    const projects = await api.getProjects({ repositoryName });
    get().addProjects(projects);
  },
  findProject: async (repoName: string, projectId: number) => {
    if (!get().fetched) {
      await get().fetchAllProjects(repoName);
    }
    return get().projects.find(
      (project) => project.id === projectId && project.repository === repoName,
    );
  },
  // eslint-disable-next-line sort-keys
  fetched: false,
  projects: [],
}));
