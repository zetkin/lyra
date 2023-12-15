/* global globalThis */

import { debug } from '@/utils/log';
import { envVarNotFound } from '@/utils/util';
import { LanguageNotFound } from '@/errors';
import LyraConfig from './utils/config';
import YAMLTranslationAdapter from './utils/adapters/YAMLTranslationAdapter';
import { simpleGit, SimpleGit, SimpleGitOptions } from 'simple-git';

const REPO_PATH = process.env.REPO_PATH ?? envVarNotFound('REPO_PATH');
const MAIN_BRANCH = process.env.MAIN_BRANCH ?? envVarNotFound('MAIN_BRANCH');

export class Store {
  public static async getLanguage(lang: string) {
    let languages: Map<string, Record<string, string>>;
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
      await git.checkout(MAIN_BRANCH);
      debug('git pull...');
      await git.pull();
      debug('git done checkout main branch and pull');
      languages = new Map<string, Record<string, string>>();
      globalThis.languages = languages;
    } else {
      debug('find languages in Memory');
      languages = globalThis.languages;
    }

    let translation: Record<string, string> = {};

    if (!languages.has(lang)) {
      debug('read language[' + lang + '] from file');
      const config = await LyraConfig.readFromDir(REPO_PATH);
      // TODO: make it multi projects
      const adapter = new YAMLTranslationAdapter(config.projects[0].translationsPath);
      const translationsForAllLanguages = await adapter.getTranslations();

      Object.entries(translationsForAllLanguages[lang]).forEach(([id, obj]) => {
        translation[id] = obj.text;
      });

      languages.set(lang, translation);
    } else {
      debug('read language [' + lang + '] from Memory');
      translation = languages.get(lang) ?? Store.throwLangNotFound(lang);
    }

    return translation;
  }

  private static throwLangNotFound(lang: string): never {
    throw new LanguageNotFound(`Language ${lang} not found`);
  }
}
