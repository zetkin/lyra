import fs from 'fs/promises';
import { logError } from '@/utils/util';
import { LyraConfigReadingError } from '@/errors';
import { parse } from 'yaml';
import path from 'path';
import { z } from 'zod';

export enum MessageKind {
  TS = 'ts',
  YAML = 'yaml',
}

const KIND_BY_FORMAT_VALUE: Record<'ts' | 'yaml', MessageKind> = {
  ts: MessageKind.TS,
  yaml: MessageKind.YAML,
};

const configSchema = z.object({
  projects: z.array(
    z.object({
      messages: z.object({
        format: z.enum(['ts', 'yaml']),
        path: z.string(),
      }),
      path: z.string(),
      translations: z.object({
        path: z.string(),
      }),
    })
  ),
});

export default class LyraConfig {
  private constructor(public readonly projects: LyraProjectConfig[]) {}

  static async readFromDir(repoPath: string): Promise<LyraConfig> {
    const filename = path.join(repoPath, 'lyra.yml');
    try {
      const ymlBuf = await fs.readFile(filename);
      const configData = parse(ymlBuf.toString());

      const parsed = configSchema.parse(configData);

      return new LyraConfig(
        parsed.projects.map((project) => {
          return new LyraProjectConfig(
            KIND_BY_FORMAT_VALUE[project.messages.format],
            path.join(repoPath, project.path, project.messages.path),
            path.join(repoPath, project.path, project.translations.path)
          );
        })
      );
    } catch (e) {
      logError(`error reading ${filename} file`);
      throw new LyraConfigReadingError(filename);
    }
  }
}

class LyraProjectConfig {
  constructor(
    public readonly messageKind: string,
    public readonly messagesPath: string,
    public readonly translationsPath: string
  ) {}
}
