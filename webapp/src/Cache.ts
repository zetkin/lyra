/* global globalThis */

import { debug } from '@/utils/log';
import YamlTranslationAdapter from '@/utils/adapters/YamlTranslationAdapter';
import { LyraConfig, ServerConfig } from '@/utils/config';
import { ProjectStore, Store } from '@/store/Store';
import { simpleGit, SimpleGit, SimpleGitOptions } from 'simple-git';

export class Cache {
  private static hasPulled: boolean = false;

  public static async getLanguage(projectName: string, lang: string) {
    const serverConfig = await ServerConfig.read();
    const serverProjectConfig =
      serverConfig.getProjectConfigByName(projectName);
    const lyraConfig = await LyraConfig.readFromDir(
      serverProjectConfig.localPath,
    );
    if (!Cache.hasPulled) {
      await Cache.gitPull(serverProjectConfig.localPath, lyraConfig.baseBranch);
    }

    const store = await Cache.getProjectStore(projectName);
    return store.getTranslations(lang);
  }

  public static async getProjectStore(
    projectName: string,
  ): Promise<ProjectStore> {
    if (!globalThis.store) {
      globalThis.store = new Store();
    }
    const serverConfig = await ServerConfig.read();
    const serverProjectConfig =
      serverConfig.getProjectConfigByName(projectName);
    const lyraConfig = await LyraConfig.readFromDir(
      serverProjectConfig.localPath,
    );
    const lyraProjectConfig = lyraConfig.getProjectConfigByPath(
      serverProjectConfig.subProjectPath,
    );

    if (
      !globalThis.store.hasProjectStore(
        serverProjectConfig.localPath,
        lyraProjectConfig.path,
      )
    ) {
      const projectStore = new ProjectStore(
        new YamlTranslationAdapter(lyraProjectConfig.translationsPath),
      );
      globalThis.store.addProjectStore(
        serverProjectConfig.localPath,
        lyraProjectConfig.path,
        projectStore,
      );
    }

    return globalThis.store.getProjectStore(
      serverProjectConfig.localPath,
      lyraProjectConfig.path,
    );
  }

  private static async gitPull(repoPath: string, branchName: string) {
    debug('read lyra.yml from project root...');
    const options: Partial<SimpleGitOptions> = {
      baseDir: repoPath,
      binary: 'git',
      maxConcurrentProcesses: 1,
      trimmed: false,
    };
    const git: SimpleGit = simpleGit(options);
    debug(`git checkout ${branchName} branch...`);
    await git.checkout(branchName);
    debug('git pull...');
    await git.pull();
    debug(`git done checkout ${branchName} branch and pull`);
    Cache.hasPulled = true;
  }
}
