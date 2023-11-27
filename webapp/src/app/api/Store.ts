/* global globalThis */
import fs from 'fs/promises';
import { parse } from 'yaml';
import { envVarNotFound, logDebug } from '@/utils/util';
import { simpleGit, SimpleGit, SimpleGitOptions } from 'simple-git';

const REPO_PATH = process.env.REPO_PATH ?? envVarNotFound('REPO_PATH');
const MAIN_BRANCH = 'main';

export class Store {
  public static async getLanguage(lang: string) {
    let languages: Map<string, Record<string, unknown>>;
    if (!globalThis.languages) {
      logDebug('Initializing languages');
      const options: Partial<SimpleGitOptions> = {
        baseDir: REPO_PATH,
        binary: 'git',
        maxConcurrentProcesses: 1,
        trimmed: false,
      };
      const git: SimpleGit = simpleGit(options);
      logDebug('git checkout main pull...');
      await git.checkout(MAIN_BRANCH);
      logDebug('git pull...');
      await git.pull();
      logDebug('git done checkout main branch and pull');
      languages = new Map<string, Record<string, unknown>>();
      globalThis.languages = languages;
    } else {
      logDebug('find languages in Memory');
      languages = globalThis.languages;
    }

    let translations: Record<string, unknown>;
    if (!languages.has(lang)) {
      logDebug('read language[' + lang +'] from file');
      // TODO: read this from .lyra.yml setting file in client repo
      const yamlPath = REPO_PATH + `/src/locale/${lang}.yml`;

      const yamlBuf = await fs.readFile(yamlPath);
      // TODO: change parsing to be flattened map of key to value, instead of object
      //       so key will be like 'key1.key2.key3' and value will be 'translated text'
      //       this will reduce the cost of looping for the object every time we need to save a message
      translations = parse(yamlBuf.toString()) as Record<string, unknown>;
      languages.set(lang, translations);
    } else {
      logDebug('read language [' + lang + '] from Memory');
      translations = languages.get(lang) ?? Store.throwLangNotFound(lang);
    }

    return translations;
  }

  private static throwLangNotFound(lang: string): never {
    throw new Error(`Language ${lang} not found`);
  }
}
