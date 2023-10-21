import fs from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

const { REPO_PATH } = process.env;

if (!REPO_PATH) {
  throw new Error("REPO_PATH variable not defined");
}

export async function GET() {
  const lang = "en"; //TODO: read from path param
  const yamlFiles: string[] = [];
  // const messages: MessageData[] = []
  for await (const item of getMessageFiles(REPO_PATH + "/src", lang)) {
    yamlFiles.push(item);
    // messages.push(...readTypedMessages(item);
  }

  return NextResponse.json({
    lang,
    data: yamlFiles,
  });
}

/**
 * Filter only yaml files inside locale folder of xx.yaml or xx.yml
 * @param dirPath
 */
async function* getMessageFiles(dirPath: string, lang: string): AsyncGenerator<string> {
  const items = await fs.readdir(dirPath);
  for (const item of items) {
    const itemPath = path.join(dirPath, item);
    const stats = await fs.stat(itemPath);
    if (stats.isDirectory()) {
      yield* getMessageFiles(itemPath, lang);
    } else if (itemPath.endsWith(`locale/${lang}.yaml`) || itemPath.endsWith(`locale/${lang}.yml`) ) {
      yield itemPath;
    }
  }
}
