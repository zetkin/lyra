/* global globalThis */

import { flatten } from 'flat';
import fs from 'fs/promises';
import { LanguageNotFound } from '@/app/api/Errors';
import { parse } from 'yaml';
import { envVarNotFound, logDebug } from '@/utils/util';
import { simpleGit, SimpleGit, SimpleGitOptions } from 'simple-git';

const REPO_PATH = process.env.REPO_PATH ?? envVarNotFound('REPO_PATH');
const MAIN_BRANCH = 'main';

export class Store {
  public static async getLanguage(lang: string) {
    let languages: Map<string, Record<string, string>>;
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
      languages = new Map<string, Record<string, string>>();
      globalThis.languages = languages;
    } else {
      logDebug('find languages in Memory');
      languages = globalThis.languages;
    }

    let translation: Record<string, string>;
    if (!languages.has(lang)) {
      logDebug('read language[' + lang + '] from file');
      // TODO: read this from .lyra.yml setting file in client repo
      const yamlPath = REPO_PATH + `/src/locale/${lang}.yml`;

      const yamlBuf = await fs.readFile(yamlPath);
      translation = flatten(parse(yamlBuf.toString()));
      languages.set(lang, translation);
    } else {
      logDebug('read language [' + lang + '] from Memory');
      translation = languages.get(lang) ?? Store.throwLangNotFound(lang);
    }

    return translation;
  }

  private static throwLangNotFound(lang: string): never {
    throw new LanguageNotFound(`Language ${lang} not found`);
  }
}
