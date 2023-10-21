import fs from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

const { REPO_PATH } = process.env;

if (!REPO_PATH) {
  throw new Error("REPO_PATH variable not defined");
}

export async function GET() {
  const items: string[] = [];
  for await (const item of getFiles(REPO_PATH + "/src")) {
    items.push(item);
  }

  return NextResponse.json({
    data: items,
  });
}

async function* getFiles(dirPath: string): AsyncGenerator<string> {
  const items = await fs.readdir(dirPath);
  for (const item of items) {
    const itemPath = path.join(dirPath, item);
    const stats = await fs.stat(itemPath);
    if (stats.isDirectory()) {
      yield* getFiles(itemPath);
    } else {
      yield itemPath;
    }
  }
}
