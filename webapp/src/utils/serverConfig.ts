import fs from 'fs/promises';
import { parse } from 'yaml';
import { z } from 'zod';
import { ProjectNameNotFoundError, ServerConfigReadingError } from '@/errors';

const serverConfigSchema = z.object({
  projects: z.array(
    z.object({
      github_token: z.string(),
      host: z.string(),
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
    const filename = '../config/projects.yaml';
    try {
      const ymlBuf = await fs.readFile(filename);
      const configData = parse(ymlBuf.toString());

      const parsed = serverConfigSchema.parse(configData);

      return new ServerConfig(
        parsed.projects.map((project) => {
          return new ServerProjectConfig(
            project.name,
            project.repo_path,
            project.project_path,
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
    public readonly repoPath: string,
    public readonly projectPath: string,
    public readonly host: string,
    public readonly owner: string,
    public readonly repo: string,
    public readonly githubToken: string,
  ) {}
}
