/* global globalThis */
import fs from 'fs/promises';
import { NextResponse } from 'next/server';
import { Octokit } from '@octokit/rest';
import { stringify } from 'yaml';
import { version } from '@/../package.json';
import { envVarNotFound, logError, logWarn } from '@/utils/util';
import { simpleGit, SimpleGit, SimpleGitOptions } from 'simple-git';

const REPO_PATH = process.env.REPO_PATH ?? envVarNotFound('REPO_PATH');
const GITHUB_AUTH = process.env.GITHUB_AUTH ?? envVarNotFound('GITHUB_AUTH');
const GITHUB_REPO = process.env.GITHUB_REPO ?? envVarNotFound('GITHUB_REPO');
const GITHUB_OWNER = process.env.GITHUB_OWNER ?? envVarNotFound('GITHUB_OWNER');

const MAIN_BRANCH = 'main';

/** used to prevent multiple requests from running at the same time */
let syncLock = false;

export async function POST() {
  if (syncLock) {
    return NextResponse.json(
      { message: 'Another Request in progress' },
      { status: 400 },
    );
  }

  try {
    syncLock = true;
    const options: Partial<SimpleGitOptions> = {
      baseDir: REPO_PATH,
      binary: 'git',
      maxConcurrentProcesses: 1,
      trimmed: false,
    };
    const git: SimpleGit = simpleGit(options);
    await git.checkout(MAIN_BRANCH);
    await git.pull();
    const languages = globalThis.languages;
    for (const lang of languages.keys()) {
      const yamlPath = REPO_PATH + `/src/locale/${lang}.yml`;
      // TODO: when language obj become a map of key to value, then it need to be converted to object before stringify
      const yamlOutput = stringify(languages.get(lang), {
        doubleQuotedAsJSON: true,
        singleQuote: true,
      });
      await fs.writeFile(yamlPath, yamlOutput);
    }
    const status = await git.status();
    if (status.files.length == 0) {
      return NextResponse.json(
        { message: 'There are no changes in main branch' },
        { status: 400 },
      );
    }
    const nowIso = new Date().toISOString().replace(/:/g, '').split('.')[0];
    const branchName = 'lyra-translate-' + nowIso;
    await git.checkoutBranch(branchName, MAIN_BRANCH);
    await git.add('.');
    await git.commit('Lyra Translate: ' + nowIso);
    await git.push(['-u', 'origin', branchName]);
    const pullRequestUrl = await createPR(branchName, nowIso);
    await git.checkout(MAIN_BRANCH);
    await git.pull();
    return NextResponse.json({
      branchName,
      pullRequestUrl,
    });
  } catch (e) {
    logError(e);
    throw e;
  } finally {
    syncLock = false;
  }

  async function createPR(branchName: string, nowIso: string): Promise<string> {
    const octokit = new Octokit({
      auth: GITHUB_AUTH,
      baseUrl: 'https://api.github.com',
      log: {
        debug: () => {},
        error: logError,
        info: () => {},
        warn: logWarn,
      },
      request: {
        agent: undefined,
        fetch: undefined,
        timeout: 0,
      },
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      userAgent: 'Lyra v' + version,
    });

    const response = await octokit.rest.pulls.create({
      base: MAIN_BRANCH,
      body: 'Created by LYRA at: ' + nowIso,
      head: branchName,
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      title: 'LYRA Translate PR: ' + nowIso,
    });

    return response.data.html_url;
  }
}
