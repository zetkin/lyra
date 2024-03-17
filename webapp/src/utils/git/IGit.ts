export interface IGit {
  clone(repoPath: string, localPath: string): Promise<void>;

  pull(): Promise<void>;

  checkout(branch: string): Promise<void>;

  commit(commitMsg: string): Promise<void>;

  newBranch(newBranchName: string, baseBranch: string): Promise<void>;

  push(branchName: string): Promise<void>;

  add(files: string[]): Promise<void>;

  statusChanged(): Promise<boolean>;
}
