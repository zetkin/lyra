import path from 'path';
import { ProjectStore } from '@/store/ProjectStore';

export class Store {
  private data = new Map<string, ProjectStore>();

  public addProjectStore(
    repoPath: string,
    projectPath: string,
    projectStore: ProjectStore,
  ) {
    this.data.set(path.join(repoPath, projectPath), projectStore);
  }

  public hasProjectStore(repoPath: string, projectPath: string): boolean {
    return this.data.has(path.join(repoPath, projectPath));
  }

  public getProjectStore(repoPath: string, projectPath: string): ProjectStore {
    const storePath = path.join(repoPath, projectPath);
    const projectStore = this.data.get(storePath);
    if (!projectStore) {
      throw new Error(`ProjectStore not found for path: ${storePath}`);
    }
    return projectStore;
  }
}
