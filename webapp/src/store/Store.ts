import fs from 'fs/promises';

import { ProjectStore } from '@/store/ProjectStore';
import MessageAdapterFactory from '@/utils/adapters/MessageAdapterFactory';
import YamlTranslationAdapter from '@/utils/adapters/YamlTranslationAdapter';
import { LyraProjectConfig } from '@/utils/lyraConfig';
import { StoreData } from './types';

const FILE_PATH = './store.json';

let store: Store | null = null;

export class Store {
  private data = new Map<string, ProjectStore>();
  private initialState: Record<string, StoreData | undefined> = {};

  public static async getProjectStore(
    lyraProjectConfig: LyraProjectConfig,
  ): Promise<ProjectStore> {
    if (!store) {
      store = new Store();
      await store.loadFromDisk();
    }

    if (!store.hasProjectStore(lyraProjectConfig.absPath)) {
      const initialProjectState = store.initialState[lyraProjectConfig.absPath];

      const projectStore = new ProjectStore(
        MessageAdapterFactory.createAdapter(lyraProjectConfig),
        new YamlTranslationAdapter(lyraProjectConfig.absTranslationsPath),
        initialProjectState,
      );
      store.addProjectStore(lyraProjectConfig.absPath, projectStore);
    }

    return store.getProjectStore(lyraProjectConfig.absPath);
  }

  public static async persistToDisk(): Promise<void> {
    if (!store) {
      return;
    }

    const payload = store.toJSON();
    const json = JSON.stringify(payload);

    await fs.writeFile(FILE_PATH, json);
  }

  public toJSON(): Record<string, unknown> {
    const data: Record<string, StoreData> = {};
    this.data.forEach((value, key) => {
      data[key] = value.toJSON();
    });

    return data;
  }

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

  public async loadFromDisk(): Promise<void> {
    try {
      const json = await fs.readFile(FILE_PATH);
      this.initialState = JSON.parse(json.toString());
    } catch (err) {
      // Do nothing. It's fine to start from scratch sometimes.
    }
  }
}
