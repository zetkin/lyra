import fs from 'fs/promises';
import { parse } from 'yaml';
import path from 'path';
import { z } from 'zod';

import { ProjectNameNotFoundError, ServerConfigReadingError } from '@/errors';
import { paths } from '@/utils/paths';

const serverConfigSchema = z.object({
  projects: z.array(
    z.object({
      base_branch: z.string().optional(),
      github_token: z.string(),
      host: z.string().optional(),
      name: z.string(),
      owner: z.string(),
      project_path: z.string(),
      repo: z.string(),
    }),
  ),
});

/**
 * Resolves the absolute path to the projects configuration file (either
 * `projects.yaml` or `projects.yml`). The search order is YAML first, then YML.
 *
 * Throws {@link ServerConfigReadingError} when neither file exists.
 * The thrown error message intentionally avoids leaking absolute paths so that
 * it can be propagated to unauthenticated clients without exposing the local
 * file‑system structure.
 */
export async function getProjectsConfigPath(): Promise<string> {
  for (const absPath of [paths.projectsYamlAbsPath, paths.projectsYmlAbsPath]) {
    try {
      await fs.access(absPath);
      return absPath;
    } catch {
      /* ignored – try the next candidate */
    }
  }

  throw new ServerConfigReadingError(
    `${path.basename(paths.projectsYamlAbsPath)}/
    ${path.basename(paths.projectsYmlAbsPath)}`,
  );
}

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

    const projectsConfigPath = await getProjectsConfigPath();
    try {
      const ymlBuf = await fs.readFile(projectsConfigPath);
      const configData = parse(ymlBuf.toString());

      if (!configData) {
        // empty config file
        return new ServerConfig([]);
      }
      const parsed = serverConfigSchema.parse(configData);

      return new ServerConfig(
        parsed.projects.map((project) => {
          return new ServerProjectConfig({
            baseBranch: project.base_branch ?? 'main',
            githubToken: project.github_token,
            host: project.host ?? 'github.com',
            name: project.name,
            owner: project.owner,
            projectPath: path.normalize(project.project_path),
            repo: project.repo,
            repoPath: path.resolve(paths.lyraProjectsAbsPath, project.repo),
          });
        }),
      );
    } catch {
      throw new ServerConfigReadingError(path.basename(projectsConfigPath));
    }
  }

  public static async getProjectConfig(
    projectName: string,
  ): Promise<ServerProjectConfig> {
    const serverConfig = await ServerConfig.read();
    return serverConfig.getProjectConfig(projectName);
  }
}

export type ServerProjectConfigProps = {
  baseBranch: string;
  githubToken: string;
  host: string;
  name: string;
  owner: string;
  projectPath: string;
  repo: string;
  repoPath: string;
};

export class ServerProjectConfig {
  public readonly baseBranch: string;
  public readonly githubToken: string;
  public readonly host: string;
  public readonly name: string;
  public readonly owner: string;
  public readonly projectPath: string;
  public readonly repo: string;
  public readonly repoPath: string;

  constructor({
    baseBranch,
    githubToken,
    host,
    name,
    owner,
    projectPath,
    repo,
    repoPath,
  }: ServerProjectConfigProps) {
    this.baseBranch = baseBranch;
    this.githubToken = githubToken;
    this.host = host;
    this.name = name;
    this.owner = owner;
    this.projectPath = projectPath;
    this.repo = repo;
    this.repoPath = repoPath;
  }

  public get originBaseBranch(): string {
    return `origin/${this.baseBranch}`;
  }

  public get cloneUrl(): string {
    return `git@${this.host}:${this.owner}/${this.repo}.git`;
  }
}
