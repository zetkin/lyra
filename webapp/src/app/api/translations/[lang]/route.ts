import { envVarNotFound } from "@/utils/util";
import fs from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import { parse } from "yaml";

const REPO_PATH = process.env.REPO_PATH ?? envVarNotFound("REPO_PATH");

export async function GET(
  req: NextRequest,
  context: { params: { lang: string; msgId: string } },
) {
  const lang = context.params.lang;
  const translatedArr: Record<string, string>[] = [];
  const yamlFile = REPO_PATH + `/src/locale/${lang}.yml`;
  const parsed = parse(await fs.readFile(yamlFile, "utf-8"));
  translatedArr.push(flattenObject(parsed));

  return NextResponse.json({
    lang,
    yamlFile,
    translations: Object.assign({}, ...translatedArr),
  });
}

function flattenObject(
  obj: Record<string, any>,
  parentKey: string = "",
): Record<string, string> {
  const result: Record<string, any> = {};

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const newKey = parentKey ? `${parentKey}.${key}` : key;

      if (typeof obj[key] === "object" && !Array.isArray(obj[key])) {
        Object.assign(result, flattenObject(obj[key], newKey));
      } else {
        result[newKey] = obj[key];
      }
    }
  }

  return result;
}
