/* global globalThis */

import { LyraProjectConfig } from '@/utils/lyraConfig';
import { ProjectStore } from '@/store/ProjectStore';
import { Store } from '@/store/Store';
import YamlTranslationAdapter from '@/utils/adapters/YamlTranslationAdapter';
import MessageAdapterFactory from './utils/adapters/MessageAdapterFactory';

export class Cache {
  public static async getProjectStore(
    lyraProjectConfig: LyraProjectConfig,
  ): Promise<ProjectStore> {
    if (!globalThis.store) {
      globalThis.store = new Store();
    }

    if (!globalThis.store.hasProjectStore(lyraProjectConfig.absPath)) {
      const projectStore = new ProjectStore(
        MessageAdapterFactory.createAdapter(lyraProjectConfig),
        new YamlTranslationAdapter(lyraProjectConfig.absTranslationsPath),
      );
      globalThis.store.addProjectStore(lyraProjectConfig.absPath, projectStore);
    }

    return globalThis.store.getProjectStore(lyraProjectConfig.absPath);
  }
}
