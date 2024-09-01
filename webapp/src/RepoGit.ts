import fs from 'fs';
import fsp from 'fs/promises';
import { Octokit } from '@octokit/rest';
import path from 'path';
import { stringify } from 'yaml';

import { Cache } from '@/Cache';
import { IGit } from '@/utils/git/IGit';
import { LyraConfig } from '@/utils/lyraConfig';
import packageJson from '../package.json';
import { ServerProjectConfig } from '@/utils/serverConfig';
import { SimpleGitWrapper } from '@/utils/git/SimpleGitWrapper';
import { unflattenObject } from '@/utils/unflattenObject';
import { debug, info, warn } from '@/utils/log';
import { WriteLanguageFileError, WriteLanguageFileErrors } from '@/errors';
import { type TranslationMap } from '@/utils/adapters';
import { getTranslationsBySourceFile } from '@/utils/translationObjectUtil';

export class RepoGit {
  private static repositories: {
    [name: string]: Promise<RepoGit>;
  } = {};

  private readonly git: IGit;
  private lyraConfig?: LyraConfig;

  private constructor(private readonly spConfig: ServerProjectConfig) {
    this.git = new SimpleGitWrapper(spConfig.repoPath);
  }

  static async getRepoGit(spConfig: ServerProjectConfig): Promise<RepoGit> {
    const key = spConfig.repoPath;
    if (key in RepoGit.repositories) {
      return RepoGit.repositories[key];
    }
    const repository = new RepoGit(spConfig);
    const work = repository.checkoutBaseAndPull();
    const promise = work.then(() => repository);
    RepoGit.repositories[key] = promise;

    return promise;
  }

  public static async cloneIfNotExist(
    spConfig: ServerProjectConfig,
  ): Promise<void> {
    if (!fs.existsSync(spConfig.repoPath)) {
      await RepoGit.clone(spConfig);
    }
  }

  private static async clone(spConfig: ServerProjectConfig): Promise<void> {
    debug(`create directory: ${spConfig.repoPath} ...`);
    await fsp.mkdir(spConfig.repoPath, { recursive: true });
    const git = new SimpleGitWrapper(spConfig.repoPath);
    debug(`Cloning repo: ${spConfig.repoPath} ...`);
    await git.clone(spConfig.cloneUrl, spConfig.repoPath);
    debug(`Cloned repo: ${spConfig.repoPath}`);
    debug(`Checkout base branch: ${spConfig.baseBranch} ...`);
    await git.checkout(spConfig.baseBranch);
    debug(`Checked out base branch: ${spConfig.baseBranch}`);
  }

  /**
   * Checkout base branch and pull
   * @returns base branch name
   */
  public async checkoutBaseAndPull(): Promise<string> {
    await this.git.checkout(this.spConfig.baseBranch);
    await this.git.pull();
    return this.spConfig.baseBranch;
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
    await this.git.newBranch(branchName, this.spConfig.baseBranch);
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
      await RepoGit.cloneIfNotExist(this.spConfig);
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
                await fsp.writeFile(yamlPath, yamlOutput);
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
