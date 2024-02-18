import { Cache } from '@/Cache';
import fs from 'fs/promises';
import { IGit } from '@/utils/git/IGit';
import { LyraConfig } from '@/utils/lyraConfig';
import { Octokit } from '@octokit/rest';
import packageJson from '../package.json';
import path from 'path';
import { SimpleGitWrapper } from '@/utils/git/SimpleGitWrapper';
import { stringify } from 'yaml';
import { unflattenObject } from '@/utils/unflattenObject';
import { debug, info, warn } from '@/utils/log';
import { WriteLanguageFileError, WriteLanguageFileErrors } from '@/errors';

export class RepoGit {
  private readonly git: IGit;
  private lyraConfig?: LyraConfig;

  constructor(public readonly repoPath: string) {
    this.git = new SimpleGitWrapper(repoPath);
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
    return await this.git.statusChanged();
  }

  public async newBranchCommitAndPush(
    branchName: string,
    addFiles: string[],
    commitMsg: string,
  ): Promise<void> {
    const lyraConfig = await this.getLyraConfig();
    await this.git.newBranch(branchName, lyraConfig.baseBranch);
    await this.git.add(addFiles);
    await this.git.commit(commitMsg);
    await this.git.push(branchName);
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
        const yamlOutput = stringify(unflattenObject(languages[lang]), {
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
