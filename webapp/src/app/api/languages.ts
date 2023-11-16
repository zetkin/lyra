import { envVarNotFound } from "@/utils/util";
import fs from "fs/promises";
import { parse } from "yaml";
import { simpleGit, SimpleGit, SimpleGitOptions } from "simple-git";

const REPO_PATH = process.env.REPO_PATH ?? envVarNotFound("REPO_PATH");
const MAIN_BRANCH = "main";

export async function getLanguage(lang: string) {
  let languages: Map<string, Record<string, unknown>>;
  if (!globalThis.languages) {
    console.debug("Initializing languages");
    const options: Partial<SimpleGitOptions> = {
      baseDir: REPO_PATH,
      binary: "git",
      maxConcurrentProcesses: 1,
      trimmed: false,
    };
    const git: SimpleGit = simpleGit(options);
    console.debug("git checkout main pull...");
    await git.checkout(MAIN_BRANCH);
    console.debug("git pull...");
    await git.pull();
    console.debug("git done checkout main branch and pull");
    languages = new Map<string, Record<string, unknown>>();
    globalThis.languages = languages;
  } else {
    console.debug("read languages from globalThis");
    languages = globalThis.languages;
  }

  let translations: Record<string, unknown>;
  if (!languages.has(lang)) {
    console.debug("read languages from file");
    const yamlPath = REPO_PATH + `/src/locale/${lang}.yml`;

    const yamlBuf = await fs.readFile(yamlPath);
    translations = parse(yamlBuf.toString()) as Record<string, unknown>;
    languages.set(lang, translations);
  } else {
    console.debug("read languages from Memory");
    translations = languages.get(lang) ?? throwLangNotFound(lang);
  }

  return translations;
}

function throwLangNotFound(lang: string): never {
  throw new Error(`Language ${lang} not found`);
}
