import fs from 'fs/promises';
import { parse } from 'yaml';
import path from 'path';
import { z } from 'zod';
import { ProjectNameNotFoundError, ServerConfigReadingError } from '@/errors';

const serverConfigSchema = z.object({
  projects: z.array(
    z.object({
      base_branch: z.string().optional(),
      github_token: z.string(),
      name: z.string(),
      owner: z.string(),
      project_path: z.string(),
      repo: z.string(),
      repo_path: z.string(),
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
    //       or only read one time and restart Lyra if change happens, need to make architecture decision about this
    const filename = '../config/projects.yaml';
    try {
      const ymlBuf = await fs.readFile(filename);
      const configData = parse(ymlBuf.toString());

      const parsed = serverConfigSchema.parse(configData);

      return new ServerConfig(
        parsed.projects.map((project) => {
          return new ServerProjectConfig(
            project.name,
            path.normalize(project.repo_path),
            project.base_branch ?? 'main',
            path.normalize(project.project_path),
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
    /** absolute local path to repo */
    public readonly repoPath: string,
    /** following GitHub terminology target branch called base branch */
    public readonly baseBranch: string,
    /** relative path of project from repo_path */
    public readonly projectPath: string,
    public readonly owner: string,
    public readonly repo: string,
    public readonly githubToken: string,
  ) {}

  public get cloneUrl(): string {
    return `git@github.com:${this.owner}/${this.repo}.git`;
  }
}
