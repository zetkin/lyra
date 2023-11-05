import { simpleGit, SimpleGit, SimpleGitOptions } from "simple-git";
import { NextRequest, NextResponse } from "next/server";

const { REPO_PATH } = process.env;
if (!REPO_PATH) {
  throw new Error("REPO_PATH variable not defined");
}
const MAIN_BRANCH = "main";

export async function POST() {
  try {
    const options: Partial<SimpleGitOptions> = {
      baseDir: REPO_PATH,
      binary: "git",
      maxConcurrentProcesses: 6,
      trimmed: false,
    };
    // TODO: create lock to prevent multiple call when this function is running
    const git: SimpleGit = simpleGit(options);
    // TODO: skip check out and pull main to avoid conflict
    await git.checkout(MAIN_BRANCH);
    await git.pull();
    // TODO: check if there is changes before checkout new branch
    // TODO: generate branch name
    const branchName = "test" + Date.now();
    await git.checkoutBranch(branchName, MAIN_BRANCH);
    await git.add(".");
    // TODO: generate commit message
    await git.commit("a message");
    await git.push(["-u", "origin", branchName]);
    // TODO: generate PR title and body in github
    await git.checkout(MAIN_BRANCH);
    await git.pull();
    return NextResponse.json({
      branchName,
      // TODO: other info
    });
  } catch (e) {
    console.log(e);
  }
}
