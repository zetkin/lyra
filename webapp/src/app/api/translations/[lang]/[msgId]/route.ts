import { parse } from "yaml";
import fs from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import { LanguageMap } from "@/types";

const REPO_PATH = process.env.REPO_PATH ?? envVarNotFound("REPO_PATH");

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

function envVarNotFound(varName: string): never {
  throw new Error(`${varName} variable not defined`);
}
