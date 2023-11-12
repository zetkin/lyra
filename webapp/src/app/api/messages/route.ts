import * as fs from "fs/promises";
import * as path from "path";
import { NextResponse } from "next/server";
import readTypedMessages, {
  MessageData,
} from "@/utils/readTypedMessages";

const { REPO_PATH } = process.env;
if (!REPO_PATH) {
  throw new Error("REPO_PATH variable not defined");
}

export async function GET() {
  const messages: MessageData[] = [];
  for await (const item of getMessageFiles(REPO_PATH + "/src")) {
    messages.push(...readTypedMessages(item));
  }

  return NextResponse.json({
    data: messages,
  });
}

async function* getMessageFiles(dirPath: string): AsyncGenerator<string> {
  const items = await fs.readdir(dirPath);
  for (const item of items) {
    const itemPath = path.join(dirPath, item);
    const stats = await fs.stat(itemPath);
    if (stats.isDirectory()) {
      yield* getMessageFiles(itemPath);
    } else if (itemPath.endsWith("messageIds.ts")) {
      yield itemPath;
    }
  }
}
