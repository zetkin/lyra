import fs from 'fs/promises';
import { Octokit } from '@octokit/rest';
import path from 'path';
import { stringify } from 'yaml';

import { IGit } from '@/utils/git/IGit';
import { LyraConfig } from '@/utils/lyraConfig';
import packageJson from '../package.json';
import { ServerProjectConfig } from '@/utils/serverConfig';
import { SimpleGitWrapper } from '@/utils/git/SimpleGitWrapper';
import { unflattenObject } from '@/utils/unflattenObject';
import { debug, error, info, warn } from '@/utils/log';
import { WriteLanguageFileError, WriteLanguageFileErrors } from '@/errors';
import { type TranslationMap } from '@/utils/adapters';
import { getTranslationsBySourceFile } from '@/utils/translationObjectUtil';
import { Store } from '@/store/Store';

export class RepoGit {
  private readonly GIT_FETCH_TTL = 30_000; // 30 sec before fetch again
  private static repositories: {
    [name: string]: Promise<RepoGit>;
  } = {};

  private lyraConfig?: LyraConfig;
  private lastPullTime: Date;

  private constructor(
    private readonly spConfig: ServerProjectConfig,
    private readonly git: IGit,
  ) {
    this.lastPullTime = new Date(0);
  }

  static async getRepoGit(spConfig: ServerProjectConfig): Promise<RepoGit> {
    const key = spConfig.repoPath;
    if (key in RepoGit.repositories) {
      return RepoGit.repositories[key];
    }
    const simpleGitWrapper = await SimpleGitWrapper.of(spConfig.repoPath);
    const repository = new RepoGit(spConfig, simpleGitWrapper);
    const work = repository.fetchAndCheckoutOriginBase();
    const promise = work.then(() => repository);
    RepoGit.repositories[key] = promise;

    return promise;
  }

  public static async cloneIfNotExist(
    spConfig: ServerProjectConfig,
  ): Promise<boolean> {
    const repoFolderExists = await RepoGit.isGitFolderExists(spConfig.repoPath);
    if (!repoFolderExists) {
      return await RepoGit.clone(spConfig);
    }
    return true;
  }

  private static async isGitFolderExists(folderPath: string): Promise<boolean> {
    try {
      const gitFolderStat = await fs.stat(path.join(folderPath, '.git'));
      return gitFolderStat.isDirectory();
    } catch {
      return false;
    }
  }

  private static async clone(spConfig: ServerProjectConfig): Promise<boolean> {
    try {
      debug(`create directory: ${spConfig.repoPath} ...`);
      await fs.mkdir(spConfig.repoPath, { recursive: true });
      const git = await SimpleGitWrapper.of(spConfig.repoPath);
      debug(`Cloning repo: ${spConfig.repoPath} ...`);
      await git.clone(spConfig.cloneUrl, spConfig.repoPath);
      debug(`Cloned repo: ${spConfig.repoPath}`);
      debug(`Checkout base branch: ${spConfig.originBaseBranch} ...`);
      await git.checkout(spConfig.originBaseBranch);
      debug(`Checked out base branch: ${spConfig.originBaseBranch}`);
      return true;
    } catch (e) {
      error(`Failed to clone repo: ${spConfig.cloneUrl} - ${e}`);
      return false;
    }
  }

  /**
   * Fetch then check out origin/<base branch>
   * @returns base branch name
   */
  public async fetchAndCheckoutOriginBase(): Promise<string> {
    const now = new Date();
    const age = now.getTime() - this.lastPullTime.getTime();
    if (age > this.GIT_FETCH_TTL) {
      // We only fetch if old
      await this.git.fetch();
      await this.git.checkout(this.spConfig.originBaseBranch);
      this.lastPullTime = now;
    }
    return this.spConfig.originBaseBranch;
  }

  public async saveLanguageFiles(projectPath: string): Promise<string[]> {
    const lyraConfig = await this.getLyraConfig();
    const projectConfig = lyraConfig.getProjectConfigByPath(projectPath);
    const projectStore = await Store.getProjectStore(projectConfig);
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
    await this.git.newBranch(branchName, this.spConfig.originBaseBranch);
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
      base: this.spConfig.baseBranch,
      body: prBody,
      head: branchName,
      owner: githubOwner,
      repo: githubRepo,
      title: prTitle,
    });

    return response.data.html_url;
  }

  async getLyraConfig(): Promise<LyraConfig> {
    if (this.lyraConfig === undefined) {
      if (!(await RepoGit.cloneIfNotExist(this.spConfig))) {
        return Promise.reject(
          new Error(`Failed to clone repository: ${this.spConfig.repoPath}`),
        );
      }
      this.lyraConfig = await LyraConfig.readFromDir(this.spConfig.repoPath);
    }
    return this.lyraConfig;
  }

  private async writeLangFiles(
    languages: TranslationMap,
    translationsPath: string,
  ): Promise<string[]> {
    const paths: string[] = [];
    const resultLang = await Promise.allSettled(
      Object.keys(languages).map(async (lang) => {
        const translationsBySourceFile = getTranslationsBySourceFile(
          languages[lang],
        );
        // for each sourceFile
        const resultSourceFile = await Promise.allSettled(
          Object.entries(translationsBySourceFile).map(
            async ([sourceFile, translation]) => {
              const yamlPath = path.join(translationsPath, sourceFile);
              const yamlOutput = stringify(unflattenObject(translation), {
                doubleQuotedAsJSON: true,
                singleQuote: true,
              });
              try {
                await fs.writeFile(yamlPath, yamlOutput, { flush: true });
              } catch (e) {
                throw new WriteLanguageFileError(yamlPath, e);
              }
              paths.push(yamlPath);
            },
          ),
        );
        if (resultSourceFile.some((r) => r.status === 'rejected')) {
          throw new WriteLanguageFileErrors(
            resultSourceFile
              .filter((r) => r.status === 'rejected')
              .map((r) => (r as PromiseRejectedResult).reason),
          );
        }
      }),
    );

    if (resultLang.some((r) => r.status === 'rejected')) {
      throw new WriteLanguageFileErrors(
        resultLang
          .filter((r) => r.status === 'rejected')
          .map((r) => (r as PromiseRejectedResult).reason),
      );
    }
    return paths;
  }
}
