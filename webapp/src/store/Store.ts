import { ProjectStore } from '@/store/ProjectStore';

export class Store {
  private data = new Map<string, ProjectStore>();

  public addProjectStore(projectPath: string, projectStore: ProjectStore) {
    this.data.set(projectPath, projectStore);
  }

  public hasProjectStore(projectPath: string): boolean {
    return this.data.has(projectPath);
  }

  public getProjectStore(projectPath: string): ProjectStore {
    const projectStore = this.data.get(projectPath);
    if (!projectStore) {
      throw new Error(`ProjectStore not found for path: ${projectPath}`);
    }
    return projectStore;
  }
}
