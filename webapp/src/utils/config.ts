import fs from 'fs/promises';
import { parse } from 'yaml';
import path from 'path';
import { z } from 'zod';

export enum MessageKind {
  TS = 'ts',
  YAML = 'yaml',
}

const KIND_BY_FORMAT_VALUE: Record<'yaml' | 'ts', MessageKind> = {
  ts: MessageKind.TS,
  yaml: MessageKind.YAML,
};

const configSchema = z.object({
  projects: z.array(
    z.object({
      path: z.string(),
      messages: z.object({
        path: z.string(),
        format: z.enum(['ts', 'yaml']),
      }),
    })
  ),
});

export default class LyraConfig {
  public messageKind: MessageKind;
  public messagesPath: string;

  constructor(messageKind = MessageKind.YAML, path = 'locale') {
    this.messageKind = messageKind;
    this.messagesPath = path;
  }

  static async readFromDir(repoPath: string): Promise<LyraConfig> {
    const ymlBuf = await fs.readFile(path.join(repoPath, 'lyra.yml'));
    const configData = parse(ymlBuf.toString());

    const parsed = configSchema.parse(configData);

    // TODO: Generate multiple "project configs" per LyraConfig
    return new LyraConfig(
      KIND_BY_FORMAT_VALUE[parsed.projects[0].messages.format],
      path.join(
        repoPath,
        parsed.projects[0].path,
        parsed.projects[0].messages.path
      )
    );
  }
}
