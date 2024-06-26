import fs from 'fs/promises';
import { parse } from 'yaml';
import path from 'path';
import { z } from 'zod';

import { LyraConfigReadingError, ProjectPathNotFoundError } from '@/errors';

export enum MessageKind {
  TS = 'ts',
  YAML = 'yaml',
}

const KIND_BY_FORMAT_VALUE: Record<'ts' | 'yaml', MessageKind> = {
  ts: MessageKind.TS,
  yaml: MessageKind.YAML,
};

const lyraConfigSchema = z.object({
  /** @deprecated baseBranch has been moved to serverConfigSchema as base_branch */
  baseBranch: z.undefined(),
  projects: z.array(
    z.object({
      languages: z.optional(z.array(z.string()).min(1)),
      messages: z.object({
        format: z.enum(['ts', 'yaml']),
        path: z.string(),
      }),
      path: z.string(),
      translations: z.object({
        path: z.string(),
      }),
    }),
  ),
});

export class LyraConfig {
  private constructor(public readonly projects: LyraProjectConfig[]) {}

  public getProjectConfigByPath(projectPath: string): LyraProjectConfig {
    const projectConfig = this.projects.find(
      (project) => project.relativePath === projectPath,
    );
    if (projectConfig) {
      return projectConfig;
    }
    throw new ProjectPathNotFoundError(projectPath);
  }

  static async readFromDir(repoPath: string): Promise<LyraConfig> {
    // TODO: cache this call with TTL
    const filename = path.join(repoPath, 'lyra.yml');
    try {
      const ymlBuf = await fs.readFile(filename);
      const configData = parse(ymlBuf.toString());

      const parsed = lyraConfigSchema.parse(configData);

      return new LyraConfig(
        parsed.projects.map((project) => {
          return new LyraProjectConfig(
            repoPath,
            project.path,
            KIND_BY_FORMAT_VALUE[project.messages.format],
            project.messages.path,
            project.translations.path,
            project.languages ?? ['en'], // default language to be english if not provided
          );
        }),
      );
    } catch (e) {
      throw new LyraConfigReadingError(filename, e);
    }
  }
}

export class LyraProjectConfig {
  constructor(
    private readonly repoPath: string,
    private readonly path: string,
    public readonly messageKind: string,
    private readonly messagesPath: string,
    private readonly translationsPath: string,
    public readonly languages: string[], // languages in ISO 639-1 code format (en, fr, de, etc.)
  ) {}

  get absPath(): string {
    return path.join(this.repoPath, this.path);
  }

  get relativePath(): string {
    return path.normalize(this.path);
  }

  get absMessagesPath(): string {
    return path.join(this.repoPath, this.path, this.messagesPath);
  }

  get absTranslationsPath(): string {
    return path.join(this.repoPath, this.path, this.translationsPath);
  }

  isLanguageSupported(lang: string): boolean {
    return this.languages.includes(lang);
  }
}
