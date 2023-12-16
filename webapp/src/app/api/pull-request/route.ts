import { Cache } from '@/Cache';
import { envVarNotFound } from '@/utils/util';
import fs from 'fs/promises';
import LyraConfig from '@/utils/config';
import { NextResponse } from 'next/server';
import { Octokit } from '@octokit/rest';
import packageJson from '@/../package.json';
import { stringify } from 'yaml';
import { unflatten } from 'flat';
import { err, warn } from '@/utils/log';
import { simpleGit, SimpleGit, SimpleGitOptions } from 'simple-git';

const REPO_PATH = process.env.REPO_PATH ?? envVarNotFound('REPO_PATH');
const GITHUB_AUTH = process.env.GITHUB_AUTH ?? envVarNotFound('GITHUB_AUTH');
const GITHUB_REPO = process.env.GITHUB_REPO ?? envVarNotFound('GITHUB_REPO');
const GITHUB_OWNER = process.env.GITHUB_OWNER ?? envVarNotFound('GITHUB_OWNER');

/** used to prevent multiple requests from running at the same time */
let syncLock = false;

export async function POST() {
  if (syncLock) {
    return NextResponse.json(
      { message: 'Another Request in progress' },
      { status: 400 }
    );
  }

  try {
    syncLock = true;
    const lyraconfig = await LyraConfig.readFromDir(REPO_PATH);
    const options: Partial<SimpleGitOptions> = {
      baseDir: REPO_PATH,
      binary: 'git',
      maxConcurrentProcesses: 1,
      trimmed: false,
    };
    const git: SimpleGit = simpleGit(options);
    await git.checkout(lyraconfig.baseBranch);
    await git.pull();
    const store = await Cache.getStore();
    const languages = await store.getLanguageData();
    const pathsToAdd: string[] = [];
    for (const lang of Object.keys(languages)) {
      // TODO: 1. make it multi projects
      //       2. use path to avoid double slash
      const yamlPath = lyraconfig.projects[0].translationsPath + `/${lang}.yml`;
      const yamlOutput = stringify(unflatten(languages[lang]), {
        doubleQuotedAsJSON: true,
        singleQuote: true,
      });
      pathsToAdd.push(yamlPath);
      await fs.writeFile(yamlPath, yamlOutput);
    }
    const status = await git.status();
    if (status.files.length == 0) {
      return NextResponse.json(
        { message: 'There are no changes in main branch' },
        { status: 400 }
      );
    }
    const nowIso = new Date().toISOString().replace(/:/g, '').split('.')[0];
    const branchName = 'lyra-translate-' + nowIso;
    await git.checkoutBranch(branchName, lyraconfig.baseBranch);
    await git.add(pathsToAdd);
    await git.commit('Lyra Translate: ' + nowIso);
    await git.push(['-u', 'origin', branchName]);
    const pullRequestUrl = await createPR(
      branchName,
      lyraconfig.baseBranch,
      nowIso
    );
    await git.checkout(lyraconfig.baseBranch);
    await git.pull();
    return NextResponse.json({
      branchName,
      pullRequestUrl,
    });
  } catch (e) {
    err(e);
    throw e;
  } finally {
    syncLock = false;
  }

  async function createPR(
    branchName: string,
    baseBranch: string,
    nowIso: string
  ): Promise<string> {
    const octokit = new Octokit({
      auth: GITHUB_AUTH,
      baseUrl: 'https://api.github.com',
      log: {
        debug: () => {},
        error: err,
        info: () => {},
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
      base: baseBranch,
      body: 'Created by LYRA at: ' + nowIso,
      head: branchName,
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      title: 'LYRA Translate PR: ' + nowIso,
    });

    return response.data.html_url;
  }
}
