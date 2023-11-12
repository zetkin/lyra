import { parse } from "yaml";
import * as fs from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import { LanguageMap } from "@/types";

const { REPO_PATH } = process.env;
if (!REPO_PATH) {
  throw new Error("REPO_PATH variable not defined");
}

export async function PUT(
  req: NextRequest,
  context: {
    params: {
      lang: string;
      msgId: string;
    };
  },
) {
  const payload = await req.json();
  const { lang, msgId } = context.params;
  const { text } = payload;

  let languages: LanguageMap;

  if (!globalThis.languages) {
    languages = new Map<string, Record<string, unknown>>();
    globalThis.languages = languages;
  } else {
    languages = globalThis.languages;
  }
  let translations: any;
  if (!languages.has(lang)) {
    const yamlPath = REPO_PATH + `/src/locale/${lang}.yml`;

    const yamlBuf = await fs.readFile(yamlPath);
    translations = parse(yamlBuf.toString());
    languages.set(lang, translations);
  } else {
    translations = languages.get(lang);
  }
  const objKeyPath = msgId.split(".");
  let curObj = translations;
  objKeyPath.forEach((key, index) => {
    if (index == objKeyPath.length - 1) {
      curObj[key] = text;
    } else {
      curObj[key] = { ...curObj[key] };
      curObj = curObj[key] as Record<string, unknown>;
    }
  });

  return NextResponse.json({
    lang,
    msgId,
    text,
  });
}
