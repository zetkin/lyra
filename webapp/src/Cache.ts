/* global globalThis */

import { debug } from '@/utils/log';
import { envVarNotFound } from '@/utils/util';
import LyraConfig from './utils/config';
import Store from './store/Store';
import YamlTranslationAdapter from './utils/adapters/YamlTranslationAdapter';
import { simpleGit, SimpleGit, SimpleGitOptions } from 'simple-git';

const REPO_PATH = process.env.REPO_PATH ?? envVarNotFound('REPO_PATH');

export class Cache {
  public static async getLanguage(lang: string) {
    let languages: Map<string, Record<string, string>>;
    debug('read lyra.yml from project root...');
    const lyraConfig = await LyraConfig.readFromDir(REPO_PATH);
    if (!globalThis.languages) {
      debug('Initializing languages');
      const options: Partial<SimpleGitOptions> = {
        baseDir: REPO_PATH,
        binary: 'git',
        maxConcurrentProcesses: 1,
        trimmed: false,
      };
      const git: SimpleGit = simpleGit(options);
      debug('git checkout main pull...');
      await git.checkout(lyraConfig.baseBranch);
      debug('git pull...');
      await git.pull();
      debug('git done checkout main branch and pull');
      languages = new Map<string, Record<string, string>>();
      globalThis.languages = languages;
    } else {
      debug('find languages in Memory');
      languages = globalThis.languages;
    }

    const store = await Cache.getStore();
    return store.getTranslations(lang);
  }

  public static async getStore(): Promise<Store> {
    if (!globalThis.store) {
      const lyraConfig = await LyraConfig.readFromDir(REPO_PATH);
      globalThis.store = new Store(
        new YamlTranslationAdapter(lyraConfig.projects[0].translationsPath)
      );
    }

    return globalThis.store;
  }
}
