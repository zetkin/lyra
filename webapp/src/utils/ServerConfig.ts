import fs from 'fs/promises';
import { parse } from 'yaml';
import { z } from 'zod';
import { ProjectNameNotFoundError, ServerConfigReadingError } from '@/errors';

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
  private static TTL = 1000 * 60 * 60; // 1 hour
  private static instance: ServerConfig;
  private static instanceTimestamp: number;

  private mProjects = new Map<string, ServerProjectConfig>();

  private constructor(projects: ServerProjectConfig[]) {
    projects.forEach((project) => {
      this.mProjects.set(project.name, project);
    });
  }

  public get projects(): Map<string, ServerProjectConfig> {
    return this.mProjects;
  }

  public getProjectConfig(projectName: string): ServerProjectConfig {
    const projectConfig = this.projects.get(projectName);
    if (projectConfig === undefined) {
      throw new ProjectNameNotFoundError(projectName);
    }
    return projectConfig;
  }

  public update(newConfig: ServerConfig) {
    // remove projects that are not in newConfig and update existing ones
    this.mProjects.forEach((project) => {
      if (!newConfig.projects.has(project.name)) {
        this.mProjects.delete(project.name);
      } else {
        project.update(newConfig.projects.get(project.name)!);
      }
    });
    // add new projects
    newConfig.projects.forEach((project) => {
      if (!this.mProjects.has(project.name)) {
        this.mProjects.set(project.name, project);
      }
    });
  }

  public static async get(useCache: boolean = true): Promise<ServerConfig> {
    if (!useCache) {
      const config = await ServerConfig.readFromFile();
      if (ServerConfig.instance) {
        ServerConfig.instance.update(config);
      } else {
        ServerConfig.instance = config;
      }
      ServerConfig.instanceTimestamp = Date.now();
      return ServerConfig.instance;
    }

    if (ServerConfig.instance) {
      if (Date.now() - ServerConfig.instanceTimestamp < this.TTL) {
        return ServerConfig.instance;
      } else {
        ServerConfig.instanceTimestamp = Date.now();
        const newConfig = await ServerConfig.readFromFile();
        ServerConfig.instance.update(newConfig);
        return ServerConfig.instance;
      }
    }

    ServerConfig.instance = await ServerConfig.readFromFile();
    ServerConfig.instanceTimestamp = Date.now();
    return ServerConfig.instance;
  }

  private static async readFromFile(): Promise<ServerConfig> {
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
    const serverConfig = await ServerConfig.get();
    return serverConfig.getProjectConfig(projectName);
  }
}

export class ServerProjectConfig {
  private mName: string;
  private mLocalPath: string;
  private mSubProjectPath: string;
  private mHost: string;
  private mOwner: string;
  private mRepo: string;
  private mGithubToken: string;

  constructor(
    name: string,
    localPath: string,
    subProjectPath: string,
    host: string,
    owner: string,
    repo: string,
    githubToken: string,
  ) {
    this.mName = name;
    this.mLocalPath = localPath;
    this.mSubProjectPath = subProjectPath;
    this.mHost = host;
    this.mOwner = owner;
    this.mRepo = repo;
    this.mGithubToken = githubToken;
  }

  public get name() {
    return this.mName;
  }

  public get localPath() {
    return this.mLocalPath;
  }

  public get subProjectPath() {
    return this.mSubProjectPath;
  }

  public get host() {
    return this.mHost;
  }

  public get owner() {
    return this.mOwner;
  }

  public get repo() {
    return this.mRepo;
  }

  public get githubToken() {
    return this.mGithubToken;
  }

  public update(newConfig: ServerProjectConfig) {
    this.mName = newConfig.name;
    this.mLocalPath = newConfig.localPath;
    this.mSubProjectPath = newConfig.subProjectPath;
    this.mHost = newConfig.host;
    this.mOwner = newConfig.owner;
    this.mRepo = newConfig.repo;
    this.mGithubToken = newConfig.githubToken;
  }
}
