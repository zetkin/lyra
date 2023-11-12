import { simpleGit, SimpleGit, SimpleGitOptions } from "simple-git";
import { NextResponse } from "next/server";
import { Octokit } from "@octokit/rest";
import * as fs from "fs/promises";
import { stringify } from "yaml";

const REPO_PATH = process.env.REPO_PATH ?? envVarNotFound("REPO_PATH");
const GITHUB_AUTH = process.env.GITHUB_AUTH ?? envVarNotFound("GITHUB_AUTH");
const GITHUB_REPO = process.env.GITHUB_REPO ?? envVarNotFound("GITHUB_REPO");
const GITHUB_OWNER = process.env.GITHUB_OWNER ?? envVarNotFound("GITHUB_OWNER");

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
    await git.checkout(MAIN_BRANCH);
    await git.pull();
    const languages = globalThis.languages;
    for (const lang of languages.keys()) {
      const yamlPath = REPO_PATH + `/src/locale/${lang}.yml`;
      const yamlOutput = stringify(languages.get(lang), {
        singleQuote: true,
        doubleQuotedAsJSON: true,
      });
      await fs.writeFile(yamlPath, yamlOutput);
    }
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
    const pullRequestUrl = await createPR(branchName);
    await git.checkout(MAIN_BRANCH);
    await git.pull();
    return NextResponse.json({
      branchName,
      pullRequestUrl,
    });
  } catch (e) {
    console.log(e);
    throw e;
  } finally {
    syncLock = false;
  }

  async function createPR(branchName: string): Promise<string> {
    const octokit = new Octokit({
      auth: GITHUB_AUTH,
      userAgent: "myApp v1.2.3",
      timeZone: "Europe/Stockholm",
      baseUrl: "https://api.github.com",
      log: {
        debug: () => {},
        info: () => {},
        warn: console.warn,
        error: console.error,
      },
      request: {
        agent: undefined,
        fetch: undefined,
        timeout: 0,
      },
    });

    const response = await octokit.rest.pulls.create({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      // TODO: generate title and body
      title: "test title " + Date.now(),
      body: "test body " + Date.now(),
      head: branchName,
      base: MAIN_BRANCH,
    });

    return response.data.html_url;
  }
}

function envVarNotFound(varName: string): never {
  throw new Error(`${varName} variable not defined`);
}
