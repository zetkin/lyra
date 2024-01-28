import { Cache } from '@/Cache';
import fs from 'fs/promises';
import { LyraConfig } from '@/utils/lyraConfig';
import { Octokit } from '@octokit/rest';
import packageJson from '../package.json';
import path from 'path';
import { stringify } from 'yaml';
import { unflatten } from 'flat';
import { debug, info, warn } from '@/utils/log';
import { simpleGit, SimpleGit, SimpleGitOptions } from 'simple-git';
import { WriteLanguageFileError, WriteLanguageFileErrors } from '@/errors';

export class RepoGit {
  private readonly git: SimpleGit;
  private lyraConfig?: LyraConfig;

  constructor(public readonly repoPath: string) {
    const options: Partial<SimpleGitOptions> = {
      baseDir: repoPath,
      binary: 'git',
      maxConcurrentProcesses: 1,
      trimmed: false,
    };
    this.git = simpleGit(options);
  }

  /**
   * Checkout base branch and pull
   * @returns base branch name
   */
  public async checkoutBaseAndPull(): Promise<string> {
    const lyraConfig = await this.getLyraConfig();
    await this.git.checkout(lyraConfig.baseBranch);
    await this.git.pull();
    return lyraConfig.baseBranch;
  }

  public async saveLanguageFiles(projectPath: string): Promise<string[]> {
    const lyraConfig = await this.getLyraConfig();
    const projectConfig = lyraConfig.getProjectConfigByPath(projectPath);
    const projectStore = await Cache.getProjectStore(projectConfig);
    const languages = await projectStore.getLanguageData();

    return await this.writeLangFiles(
      languages,
      projectConfig.absTranslationsPath,
    );
  }

  public async statusChanged(): Promise<boolean> {
    const status = await this.git.status();
    return status.files.length > 0;
  }

  public async newBranchCommitAndPush(
    branchName: string,
    addFiles: string[],
    commitMsg: string,
  ): Promise<void> {
    const lyraConfig = await this.getLyraConfig();
    await this.git.checkoutBranch(branchName, lyraConfig.baseBranch);
    await this.git.add(addFiles);
    await this.git.commit(commitMsg);
    await this.git.push(['-u', 'origin', branchName]);
  }

  public async createPR(
    branchName: string,
    prTitle: string,
    prBody: string,
    githubOwner: string,
    githubRepo: string,
    githubToken: string,
  ): Promise<string> {
    const lyraConfig = await this.getLyraConfig();
    const octokit = new Octokit({
      auth: githubToken,
      baseUrl: 'https://api.github.com',
      log: {
        debug: debug,
        error: () => {},
        info: info,
        warn: warn,
      },
      request: {
        agent: undefined,
        fetch: undefined,
        timeout: 0,
      },
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      userAgent: 'Lyra v' + packageJson.version,
    });

    const response = await octokit.rest.pulls.create({
      base: lyraConfig.baseBranch,
      body: prBody,
      head: branchName,
      owner: githubOwner,
      repo: githubRepo,
      title: prTitle,
    });

    return response.data.html_url;
  }

  private async getLyraConfig(): Promise<LyraConfig> {
    if (this.lyraConfig) {
      return this.lyraConfig;
    }
    this.lyraConfig = await LyraConfig.readFromDir(this.repoPath);
    return this.lyraConfig;
  }

  private async writeLangFiles(
    languages: Record<string, Record<string, string>>,
    translationsPath: string,
  ): Promise<string[]> {
    const paths: string[] = [];
    const result = await Promise.allSettled(
      Object.keys(languages).map(async (lang) => {
        const yamlPath = path.join(
          translationsPath,
          // TODO: what if language file were yaml not yml?
          `${lang}.yml`,
        );
        const yamlOutput = stringify(unflatten(languages[lang]), {
          doubleQuotedAsJSON: true,
          singleQuote: true,
        });
        try {
          await fs.writeFile(yamlPath, yamlOutput);
        } catch (e) {
          throw new WriteLanguageFileError(yamlPath, e);
        }
        paths.push(yamlPath);
      }),
    );
    if (result.some((r) => r.status === 'rejected')) {
      throw new WriteLanguageFileErrors(
        result
          .filter((r) => r.status === 'rejected')
          .map((r) => (r as PromiseRejectedResult).reason),
      );
    }
    return paths;
  }
}
