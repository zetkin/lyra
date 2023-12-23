import fs from 'fs/promises';
import { parse } from 'yaml';
import path from 'path';
import { z } from 'zod';
import {
  LyraConfigReadingError,
  ProjectNameNotFoundError,
  ProjectPathNotFoundError,
  ServerConfigReadingError,
} from '@/errors';

export enum MessageKind {
  TS = 'ts',
  YAML = 'yaml',
}

const KIND_BY_FORMAT_VALUE: Record<'ts' | 'yaml', MessageKind> = {
  ts: MessageKind.TS,
  yaml: MessageKind.YAML,
};

const lyraConfigSchema = z.object({
  baseBranch: z.optional(z.string()),
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
    }),
  ),
});

export class LyraConfig {
  private constructor(
    public readonly projects: LyraProjectConfig[],
    public readonly baseBranch: string, // following GitHub terminology target branch called base branch
  ) {}

  public getProjectConfigByPath(projectPath: string): LyraProjectConfig {
    const projectConfig = this.projects.find(
      (project) => project.path === projectPath,
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
            project.path,
            KIND_BY_FORMAT_VALUE[project.messages.format],
            path.join(repoPath, project.path, project.messages.path),
            path.join(repoPath, project.path, project.translations.path),
          );
        }),
        parsed.baseBranch ?? 'main',
      );
    } catch (e) {
      throw new LyraConfigReadingError(filename);
    }
  }
}

export class LyraProjectConfig {
  constructor(
    public readonly path: string,
    public readonly messageKind: string,
    public readonly messagesPath: string,
    public readonly translationsPath: string,
  ) {}
}

const serverConfigSchema = z.object({
  projects: z.array(
    z.object({
      github_token: z.string(),
      host: z.string(),
      local_path: z.string(),
      name: z.string(),
      owner: z.string(),
      repo: z.string(),
      sub_project_path: z.string(),
    }),
  ),
});

export class ServerConfig {
  private constructor(public readonly projects: ServerProjectConfig[]) {}

  public getProjectConfig(projectName: string): ServerProjectConfig {
    const projectConfig = this.projects.find(
      (project) => project.name === projectName,
    );
    if (projectConfig) {
      return projectConfig;
    }
    throw new ProjectNameNotFoundError(projectName);
  }

  public static async read(): Promise<ServerConfig> {
    // TODO: cache this call with TTL, it will be read on every request but only changes when admin changes it
    const filename = '../config/projects.yaml';
    try {
      const ymlBuf = await fs.readFile(filename);
      const configData = parse(ymlBuf.toString());

      const parsed = serverConfigSchema.parse(configData);

      return new ServerConfig(
        parsed.projects.map((project) => {
          return new ServerProjectConfig(
            project.name,
            project.local_path,
            project.sub_project_path,
            project.host,
            project.owner,
            project.repo,
            project.github_token,
          );
        }),
      );
    } catch (e) {
      throw new ServerConfigReadingError(filename);
    }
  }

  public static async getProjectConfig(
    projectName: string,
  ): Promise<ServerProjectConfig> {
    const serverConfig = await ServerConfig.read();
    return serverConfig.getProjectConfig(projectName);
  }
}

export class ServerProjectConfig {
  constructor(
    public readonly name: string,
    public readonly localPath: string,
    public readonly subProjectPath: string,
    public readonly host: string,
    public readonly owner: string,
    public readonly repo: string,
    public readonly githubToken: string,
  ) {}
}
