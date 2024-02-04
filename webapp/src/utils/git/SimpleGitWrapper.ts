import { IGit } from './IGit';
import { simpleGit, SimpleGit, SimpleGitOptions } from 'simple-git';

export class SimpleGitWrapper implements IGit {
  private readonly git: SimpleGit;

  public constructor(public readonly repoPath: string) {
    const options: Partial<SimpleGitOptions> = {
      baseDir: repoPath,
      binary: 'git',
      maxConcurrentProcesses: 1,
      trimmed: false,
    };
    this.git = simpleGit(options);
  }

  public async pull(): Promise<void> {
    await this.git.pull();
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
