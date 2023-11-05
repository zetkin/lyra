import { simpleGit, SimpleGit, SimpleGitOptions } from "simple-git";
import { NextResponse } from "next/server";

const { REPO_PATH } = process.env;
if (!REPO_PATH) {
  throw new Error("REPO_PATH variable not defined");
}
const MAIN_BRANCH = "main";
let syncLock = false;

export async function POST() {
  if (syncLock) {
    return NextResponse.json(
      { message: "Another Request in progress" },
      { status: 400 },
    );
  }

  try {
    syncLock = true;
    const options: Partial<SimpleGitOptions> = {
      baseDir: REPO_PATH,
      binary: "git",
      maxConcurrentProcesses: 1,
      trimmed: false,
    };
    const git: SimpleGit = simpleGit(options);
    // TODO: skip check out and pull main to avoid conflict
    await git.checkout(MAIN_BRANCH);
    await git.pull();
    const status = await git.status();
    if (status.files.length == 0) {
      return NextResponse.json(
        { message: "There are no changes in main branch" },
        { status: 400 },
      );
    }
    // TODO: generate branch name
    const branchName = "delete_me_" + Date.now();
    await git.checkoutBranch(branchName, MAIN_BRANCH);
    await git.add(".");
    // TODO: generate commit message
    await git.commit("commit message");
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
    throw e;
  } finally {
    syncLock = false;
  }
}
