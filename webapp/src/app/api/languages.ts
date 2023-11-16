import { envVarNotFound } from "@/utils/util";
import fs from "fs/promises";
import { parse } from "yaml";

const REPO_PATH = process.env.REPO_PATH ?? envVarNotFound("REPO_PATH");

export async function getLanguage(lang: string) {
  let languages: Map<string, Record<string, unknown>>;
  if (!globalThis.languages) {
    console.debug("Initializing languages");
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
