import { parse, stringify } from "yaml";
import fs from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import * as state from "../../../state";

export async function PUT(
  req: NextRequest,
  context: { params: { lang: string; msgId: string } },
) {
  const payload = await req.json();
  const { lang, msgId } = context.params;
  const { text } = payload;

  const yamlPath = state.REPO_PATH + `/src/locale/${lang}.yml`;

  const yamlBuf = await fs.readFile(yamlPath);
  const translations = parse(yamlBuf.toString());

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

  const yamlOutput = stringify(translations, {
    singleQuote: true,
    doubleQuotedAsJSON: true,
  });
  await fs.writeFile(yamlPath, yamlOutput);

  return NextResponse.json({
    lang,
    msgId,
    text,
  });
}
