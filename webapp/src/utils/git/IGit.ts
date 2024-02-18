export interface IGit {
  pull(): Promise<void>;

  checkout(branch: string): Promise<void>;

  commit(commitMsg: string): Promise<void>;

  newBranch(newBranchName: string, baseBranch: string): Promise<void>;

  push(branchName: string): Promise<void>;

  add(files: string[]): Promise<void>;

  statusChanged(): Promise<boolean>;
}
