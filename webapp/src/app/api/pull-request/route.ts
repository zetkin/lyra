import { Cache } from '@/Cache';
import { envVarNotFound } from '@/utils/util';
import fs from 'fs/promises';
import { LyraConfig } from '@/utils/config';
import { Octokit } from '@octokit/rest';
import packageJson from '@/../package.json';
import path from 'path';
import { stringify } from 'yaml';
import { unflatten } from 'flat';
import { debug, info, warn } from '@/utils/log';
import { NextRequest, NextResponse } from 'next/server';
import { simpleGit, SimpleGit, SimpleGitOptions } from 'simple-git';

const REPO_PATH = process.env.REPO_PATH ?? envVarNotFound('REPO_PATH');
const GITHUB_AUTH = process.env.GITHUB_AUTH ?? envVarNotFound('GITHUB_AUTH');
const GITHUB_REPO = process.env.GITHUB_REPO ?? envVarNotFound('GITHUB_REPO');
const GITHUB_OWNER = process.env.GITHUB_OWNER ?? envVarNotFound('GITHUB_OWNER');

/** used to prevent multiple requests from running at the same time */
let syncLock = false;

export async function POST(req: NextRequest) {
  if (syncLock) {
    return NextResponse.json(
      { message: 'Another Request in progress' },
      { status: 400 },
    );
  }

  try {
    syncLock = true;
    const lyraConfig = await LyraConfig.readFromDir(REPO_PATH);
    const options: Partial<SimpleGitOptions> = {
      baseDir: REPO_PATH,
      binary: 'git',
      maxConcurrentProcesses: 1,
      trimmed: false,
    };
    const git: SimpleGit = simpleGit(options);
    await git.checkout(lyraConfig.baseBranch);
    await git.pull();
    const payload = await req.json();
    const projectConfig = payload.project
      ? lyraConfig.getProjectConfigByPath(payload.project)
      : lyraConfig.projects[0];
    const projectStore = await Cache.getProjectStore(projectConfig.path);
    const languages = await projectStore.getLanguageData();
    const pathsToAdd: string[] = [];
    // TODO: use forEach and Promise.all
    for (const lang of Object.keys(languages)) {
      const yamlPath = path.join(projectConfig.translationsPath, `${lang}.yml`);
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
        { message: `There are no changes in ${lyraConfig.baseBranch} branch` },
        { status: 400 },
      );
    }
    const nowIso = new Date().toISOString().replace(/:/g, '').split('.')[0];
    const branchName = 'lyra-translate-' + nowIso;
    await git.checkoutBranch(branchName, lyraConfig.baseBranch);
    await git.add(pathsToAdd);
    await git.commit('Lyra Translate: ' + nowIso);
    await git.push(['-u', 'origin', branchName]);
    const pullRequestUrl = await createPR(
      branchName,
      lyraConfig.baseBranch,
      nowIso,
    );
    await git.checkout(lyraConfig.baseBranch);
    await git.pull();
    return NextResponse.json({
      branchName,
      pullRequestUrl,
    });
  } finally {
    syncLock = false;
  }

  async function createPR(
    branchName: string,
    baseBranch: string,
    nowIso: string,
  ): Promise<string> {
    const octokit = new Octokit({
      auth: GITHUB_AUTH,
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
