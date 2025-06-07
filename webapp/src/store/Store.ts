import fs from 'fs/promises';

import { ProjectStore } from '@/store/ProjectStore';
import MessageAdapterFactory from '@/utils/adapters/MessageAdapterFactory';
import YamlTranslationAdapter from '@/utils/adapters/YamlTranslationAdapter';
import { LyraProjectConfig } from '@/utils/lyraConfig';
import { StoreData } from './types';
import { error } from '@/utils/log';
import { fileExists } from '@/utils/fileExists';

const FILE_PATH = './store.json';

export class Store {
  private data = new Map<string, ProjectStore>();
  private initialState: Record<string, StoreData | undefined> = {};
  private writes: Promise<void> = Promise.resolve();

  public static async getProjectStore(
    lyraProjectConfig: LyraProjectConfig,
  ): Promise<ProjectStore> {
    /**
     * As this function is not async,
     * no concurrent task executes between checking and updating globalThis.
     */
    function initialize(): Promise<Store> {
      if (!globalThis.store) {
        const newStore = new Store();
        globalThis.store = newStore
          .loadFromDisk()
          .catch((reason) => {
            // Forget the promise, so that the next call will retry.
            globalThis.store = null;
            error(`Failed to initialize lyra store: ${reason}`);
            throw reason;
          })
          .then(() => newStore);
      }
      return globalThis.store;
    }

    const store = await initialize();

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
    const store = await globalThis.store;
    if (!store) {
      return;
    }

    // Retain initial data if we have not opened a ProjectStore
    const payload = {};
    Object.assign(payload, store.initialState, store.toJSON());

    const json = JSON.stringify(payload);

    // Enqueue the new write, as concurrent writeFile is unsafe.
    store.writes = store.writes.finally(() =>
      fs.writeFile(FILE_PATH, json, { flush: true }),
    );

    // Await the end of the queue, which is our write, to resolve.
    await store.writes;
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

  private async loadFromDisk(): Promise<void> {
    if (!(await fileExists(FILE_PATH))) {
      await fs.writeFile(FILE_PATH, JSON.stringify(this.initialState));
    }

    await fs.access(FILE_PATH);
    const json = await fs.readFile(FILE_PATH, 'utf-8');
    this.initialState = JSON.parse(json);
  }
}
