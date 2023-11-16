import { NextRequest, NextResponse } from "next/server";
import { getLanguage } from "@/app/api/languages";

export async function GET(
  req: NextRequest, // keep this here even if unused
  context: { params: { lang: string; msgId: string } },
) {
  const lang = context.params.lang;
  const langObj = await getLanguage(lang);
  const flattenLangObj = flattenObject(langObj);

  return NextResponse.json({
    lang,
    translations: flattenLangObj,
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
