import fs from 'fs/promises';

import { ProjectStore } from '@/store/ProjectStore';
import MessageAdapterFactory from '@/utils/adapters/MessageAdapterFactory';
import YamlTranslationAdapter from '@/utils/adapters/YamlTranslationAdapter';
import { LyraProjectConfig } from '@/utils/lyraConfig';
import { StoreData } from './types';

const FILE_PATH = './store.json';

/**
 * Either we promised to complete initialization,
 * or we are ready to initialize.
 *
 * Every concurrent task can await the same initialization.
 */
let promise: Promise<Store> | null = null;

export class Store {
  private data = new Map<string, ProjectStore>();
  private initialState: Record<string, StoreData | undefined> = {};
  private writes: Promise<void> = Promise.resolve();

  public static async getProjectStore(
    lyraProjectConfig: LyraProjectConfig,
  ): Promise<ProjectStore> {
    /**
     * As this function is not async,
     * no concurrent task executes between checking and assigning promise.
     */
    function initialize(): Promise<Store> {
      if (!promise) {
        const newStore = new Store();
        promise = newStore
          .loadFromDisk()
          .catch((reason) => {
            // Forget the promise, so that the next call will retry.
            promise = null;
            throw reason;
          })
          .then(() => newStore);
      }
      return promise;
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
    const store = await promise;
    if (!store) {
      return;
    }

    const payload = store.toJSON();
    const json = JSON.stringify(payload);

    // Enqueue the new write, as concurrent writeFile is unsafe.
    store.writes = store.writes.finally(() => fs.writeFile(FILE_PATH, json));

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

  public async loadFromDisk(): Promise<void> {
    try {
      const json = await fs.readFile(FILE_PATH);
      this.initialState = JSON.parse(json.toString());
    } catch (err) {
      // Do nothing. It's fine to start from scratch sometimes.
    }
  }
}
