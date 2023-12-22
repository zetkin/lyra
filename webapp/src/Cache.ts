/* global globalThis */

import { debug } from '@/utils/log';
import { envVarNotFound } from '@/utils/util';
import LyraConfig from '@/utils/config';
import YamlTranslationAdapter from '@/utils/adapters/YamlTranslationAdapter';
import { ProjectStore, Store } from '@/store/Store';
import { simpleGit, SimpleGit, SimpleGitOptions } from 'simple-git';

const REPO_PATH = process.env.REPO_PATH ?? envVarNotFound('REPO_PATH');

export class Cache {
  private static hasPulled: boolean = false;

  public static async getLanguage(projectPath: string, lang: string) {
    if (!Cache.hasPulled) {
      await Cache.gitPull();
    }

    const store = await Cache.getProjectStore(projectPath);
    return store.getTranslations(lang);
  }

  public static async getProjectStore(
    projectPath: string,
  ): Promise<ProjectStore> {
    if (!globalThis.store) {
      globalThis.store = new Store();
    }

    const lyraConfig = await LyraConfig.readFromDir(REPO_PATH);
    const projectConfig = projectPath
      ? lyraConfig.getProjectConfigByPath(projectPath)
      : lyraConfig.projects[0];

    if (!globalThis.store.hasProjectStore(projectConfig.path)) {
      const projectStore = new ProjectStore(
        new YamlTranslationAdapter(projectConfig.translationsPath),
      );
      globalThis.store.addProjectStore(projectConfig.path, projectStore);
    }

    return globalThis.store.getProjectStore(projectConfig.path);
  }

  private static async gitPull() {
    debug('read lyra.yml from project root...');
    const lyraConfig = await LyraConfig.readFromDir(REPO_PATH);
    const options: Partial<SimpleGitOptions> = {
      baseDir: REPO_PATH,
      binary: 'git',
      maxConcurrentProcesses: 1,
      trimmed: false,
    };
    const git: SimpleGit = simpleGit(options);
    debug(`git checkout ${lyraConfig.baseBranch} branch...`);
    await git.checkout(lyraConfig.baseBranch);
    debug('git pull...');
    await git.pull();
    debug(`git done checkout ${lyraConfig.baseBranch} branch and pull`);
    Cache.hasPulled = true;
  }
}
