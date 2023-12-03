/* global globalThis */
import LyraConfig from '@/utils/config';
import YAMLTranslationAdapter from '@/utils/adapters/YAMLTranslationAdapter';
import { envVarNotFound, logDebug } from '@/utils/util';
import { simpleGit, SimpleGit, SimpleGitOptions } from 'simple-git';

const REPO_PATH = process.env.REPO_PATH ?? envVarNotFound('REPO_PATH');
const MAIN_BRANCH = process.env.MAIN_BRANCH ?? envVarNotFound('MAIN_BRANCH');

export async function getLanguage(lang: string) {
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
    logDebug('read languages from globalThis');
    languages = globalThis.languages;
  }

  let translations: Record<string, unknown>;
  if (!languages.has(lang)) {
    logDebug('read languages from file');
    const config = await LyraConfig.readFromDir(REPO_PATH);
    const adapter = new YAMLTranslationAdapter(config.translationsPath);
    const translationsForAllLanguages = await adapter.getTranslations();

    // TODO: Don't reshape this, but change how it's used elsewhere instead
    const reshaped: Record<string, string> = {};
    Object.entries(translationsForAllLanguages[lang]).forEach(([id, obj]) => {
      reshaped[id] = obj.text;
    });

    languages.set(lang, reshaped);

    translations = reshaped;
  } else {
    logDebug('read languages from Memory');
    translations = languages.get(lang) ?? throwLangNotFound(lang);
  }

  return translations;
}

function throwLangNotFound(lang: string): never {
  throw new Error(`Language ${lang} not found`);
}
