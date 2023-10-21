import fs from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

const { REPO_PATH } = process.env;

if (!REPO_PATH) {
  throw new Error("REPO_PATH variable not defined");
}

export async function GET() {
  const yamlFiles: string[] = [];
  // const messages: MessageData[] = []
  for await (const item of getMessageFiles(REPO_PATH + "/src")) {
    yamlFiles.push(item);
    // messages.push(...readTypedMessages(item);
  }

  return NextResponse.json({
    data: yamlFiles,
  });
}

async function* getMessageFiles(dirPath: string): AsyncGenerator<string> {
  const items = await fs.readdir(dirPath);
  for (const item of items) {
    const itemPath = path.join(dirPath, item);
    const stats = await fs.stat(itemPath);
    if (stats.isDirectory()) {
      yield* getMessageFiles(itemPath);
    } else if (itemPath.match(/\/locale\/..\.yml$/g)) {
      yield itemPath;
    }
  }
}
