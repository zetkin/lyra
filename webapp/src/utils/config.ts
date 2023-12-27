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
  private static TTL = 1000 * 60 * 60; // 1 hour
  private static instances = new Map<string, LyraConfig>();
  private static instancesTimestamp = new Map<string, number>();

  private mBaseBranch: string;
  private mProjects = new Map<string, LyraProjectConfig>();

  private constructor(
    projects: LyraProjectConfig[],
    baseBranch: string, // following GitHub terminology target branch called base branch
  ) {
    this.mBaseBranch = baseBranch;
    projects.forEach((project) => {
      this.mProjects.set(project.path, project);
    });
  }

  public get baseBranch(): string {
    return this.mBaseBranch;
  }

  public get projects(): Map<string, LyraProjectConfig> {
    return this.mProjects;
  }

  public getProjectConfigByPath(projectPath: string): LyraProjectConfig {
    const projectConfig = this.mProjects.get(projectPath);
    if (projectConfig === undefined) {
      throw new ProjectPathNotFoundError(projectPath);
    }
    return projectConfig;
  }

  public update(newConfig: LyraConfig) {
    this.mBaseBranch = newConfig.baseBranch;
    // remove projects that are not in newConfig and update existing ones
    this.mProjects.forEach((project) => {
      if (!newConfig.projects.has(project.path)) {
        this.mProjects.delete(project.path);
      } else {
        project.update(newConfig.projects.get(project.path)!);
      }
    });
    // add new projects
    newConfig.projects.forEach((project) => {
      if (!this.mProjects.has(project.path)) {
        this.mProjects.set(project.path, project);
      }
    });
  }

  public static async get(
    repoPath: string,
    useCache: boolean = true,
  ): Promise<LyraConfig> {
    if (!useCache) {
      const newConfig = await LyraConfig.readFromDir(repoPath);
      if (LyraConfig.instances.has(repoPath)) {
        const config = LyraConfig.instances.get(repoPath)!;
        config.update(newConfig);
        LyraConfig.instancesTimestamp.set(repoPath, Date.now());
        return config;
      }
      LyraConfig.instances.set(repoPath, newConfig);
      LyraConfig.instancesTimestamp.set(repoPath, Date.now());
      return newConfig;
    }
    if (LyraConfig.instances.has(repoPath)) {
      const config = LyraConfig.instances.get(repoPath)!;
      if (
        LyraConfig.instancesTimestamp.has(repoPath) &&
        Date.now() - LyraConfig.instancesTimestamp.get(repoPath)! < this.TTL
      ) {
        return config;
      } else {
        LyraConfig.instancesTimestamp.delete(repoPath);
        const newConfig = await LyraConfig.readFromDir(repoPath);
        config.update(newConfig);
        LyraConfig.instancesTimestamp.set(repoPath, Date.now());
        return config;
      }
    } else {
      const newConfig = await LyraConfig.readFromDir(repoPath);
      LyraConfig.instances.set(repoPath, newConfig);
      LyraConfig.instancesTimestamp.set(repoPath, Date.now());
      return newConfig;
    }
  }

  private static async readFromDir(repoPath: string): Promise<LyraConfig> {
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
  private mPath: string;
  private mMessageKind: string;
  private mMessagesPath: string;
  private mTranslationsPath: string;

  constructor(
    path: string,
    messageKind: string,
    messagesPath: string,
    translationsPath: string,
  ) {
    this.mPath = path;
    this.mMessageKind = messageKind;
    this.mMessagesPath = messagesPath;
    this.mTranslationsPath = translationsPath;
  }

  public get path(): string {
    return this.mPath;
  }

  public get messageKind(): string {
    return this.mMessageKind;
  }

  public get messagesPath(): string {
    return this.mMessagesPath;
  }

  public get translationsPath(): string {
    return this.mTranslationsPath;
  }

  public update(newConfig: LyraProjectConfig) {
    this.mPath = newConfig.path;
    this.mMessageKind = newConfig.messageKind;
    this.mMessagesPath = newConfig.messagesPath;
    this.mTranslationsPath = newConfig.translationsPath;
  }
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
