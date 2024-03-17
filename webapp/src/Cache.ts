/* global globalThis */

import { debug } from '@/utils/log';
import { IGit } from '@/utils/git/IGit';
import { LanguageNotSupported } from '@/errors';
import { ProjectStore } from '@/store/ProjectStore';
import { RepoGit } from '@/RepoGit';
import { SimpleGitWrapper } from '@/utils/git/SimpleGitWrapper';
import { Store } from '@/store/Store';
import YamlTranslationAdapter from '@/utils/adapters/YamlTranslationAdapter';
import { LyraConfig, LyraProjectConfig } from '@/utils/lyraConfig';
import { ServerConfig, ServerProjectConfig } from '@/utils/serverConfig';

export class Cache {
  private static hasPulled = new Set<string>();

  public static async getLanguage(projectName: string, lang: string) {
    const serverProjectConfig =
      await ServerConfig.getProjectConfig(projectName);
    await Cache.gitPullIfNeeded(serverProjectConfig);
    const lyraConfig = await LyraConfig.readFromDir(
      serverProjectConfig.repoPath,
    );
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

  private static async gitPullIfNeeded(spConfig: ServerProjectConfig) {
    const { repoPath, baseBranch } = spConfig;
    if (Cache.hasPulled.has(repoPath)) {
      debug(`repoPath: ${repoPath} is already pulled`);
      return;
    }
    await RepoGit.cloneIfNotExist(spConfig);
    debug(`prepare git options for path: ${repoPath}`);
    const git: IGit = new SimpleGitWrapper(repoPath);
    debug(`git checkout ${baseBranch} branch...`);
    await git.checkout(baseBranch);
    debug('git pull...');
    await git.pull();
    debug(`git done checkout ${baseBranch} branch and pull`);
    Cache.hasPulled.add(repoPath);
  }
}
