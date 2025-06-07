import { simpleGit, SimpleGit, SimpleGitOptions } from 'simple-git';

import { IGit } from './IGit';

export class SimpleGitWrapper implements IGit {
  private readonly git: SimpleGit;

  private constructor(public readonly repoPath: string) {
    this.git = simpleGit(SimpleGitWrapper.getSimpleGitOptions(repoPath));
  }

  public static async of(repoPath: string): Promise<SimpleGitWrapper> {
    return new SimpleGitWrapper(repoPath);
  }

  public static async isGitRepo(repoPath: string): Promise<boolean> {
    try {
      const options = SimpleGitWrapper.getSimpleGitOptions(repoPath);
      await simpleGit(options).status();
      return true;
    } catch {
      return false;
    }
  }

  private static getSimpleGitOptions(
    repoPath: string,
  ): Partial<SimpleGitOptions> {
    return {
      baseDir: repoPath,
      binary: 'git',
      /**
       * We disable symlinks to reduce risk of access to files
       * outside of the local repository.
       */
      config: ['core.symlinks=false'],
      maxConcurrentProcesses: 1,
      trimmed: false,
    };
  }

  public async clone(repoPath: string, localPath: string): Promise<void> {
    await this.git.clone(repoPath, localPath);
  }

  public async fetch(): Promise<void> {
    await this.git.fetch();
  }

  public async checkout(branch: string): Promise<void> {
    await this.git.checkout(branch);
  }

  public async commit(commitMsg: string): Promise<void> {
    await this.git.commit(commitMsg);
  }

  public async newBranch(
    newBranchName: string,
    baseBranch: string,
  ): Promise<void> {
    await this.git.checkoutBranch(newBranchName, baseBranch);
  }

  public async push(branchName: string): Promise<void> {
    await this.git.push(['-u', 'origin', branchName]);
  }

  public async add(files: string[]): Promise<void> {
    await this.git.add(files);
  }

  public async statusChanged(): Promise<boolean> {
    const status = await this.git.status();
    return status.files.length > 0;
  }
}
