/* global globalThis */

import { LanguageNotSupported } from '@/errors';
import { LyraProjectConfig } from '@/utils/lyraConfig';
import { ProjectStore } from '@/store/ProjectStore';
import { RepoGit } from '@/RepoGit';
import { ServerConfig } from '@/utils/serverConfig';
import { Store } from '@/store/Store';
import YamlTranslationAdapter from '@/utils/adapters/YamlTranslationAdapter';

export class Cache {
  public static async getLanguage(projectName: string, lang: string) {
    const serverProjectConfig =
      await ServerConfig.getProjectConfig(projectName);
    const repo = await RepoGit.getRepoGit(serverProjectConfig);
    const lyraConfig = await repo.getLyraConfig();
    const lyraProjectConfig = lyraConfig.getProjectConfigByPath(
      serverProjectConfig.projectPath,
    );
    if (!lyraProjectConfig.isLanguageSupported(lang)) {
      throw new LanguageNotSupported(lang, projectName);
    }
    const store = await Cache.getProjectStore(lyraProjectConfig);
    return store.getTranslations(lang);
  }

  public static async getProjectStore(
    lyraProjectConfig: LyraProjectConfig,
  ): Promise<ProjectStore> {
    if (!globalThis.store) {
      globalThis.store = new Store();
    }

    if (!globalThis.store.hasProjectStore(lyraProjectConfig.absPath)) {
      const projectStore = new ProjectStore(
        new YamlTranslationAdapter(lyraProjectConfig.absTranslationsPath),
      );
      globalThis.store.addProjectStore(lyraProjectConfig.absPath, projectStore);
    }

    return globalThis.store.getProjectStore(lyraProjectConfig.absPath);
  }
}
