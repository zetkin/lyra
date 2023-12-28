import { Cache } from '@/Cache';
import fs from 'fs/promises';
import { Octokit } from '@octokit/rest';
import packageJson from '@/../package.json';
import path from 'path';
import { ProjectNameNotFoundError } from '@/errors';
import { stringify } from 'yaml';
import { unflatten } from 'flat';
import { debug, info, warn } from '@/utils/log';
import {
  LyraConfig,
  ServerConfig,
  ServerProjectConfig,
} from '@/utils/lyraConfig';
import { NextRequest, NextResponse } from 'next/server';
import { simpleGit, SimpleGit, SimpleGitOptions } from 'simple-git';

/** used to prevent multiple requests from running at the same time */
const syncLock = new Map<string, boolean>();

export async function POST(
  req: NextRequest,
  context: { params: { projectName: string } },
) {
  const projectName = context.params.projectName;
  let serverProjectConfig: ServerProjectConfig;
  try {
    serverProjectConfig = await ServerConfig.getProjectConfig(projectName);
  } catch (e) {
    if (e instanceof ProjectNameNotFoundError) {
      return NextResponse.json({ message: e.message }, { status: 404 });
    }
    throw e;
  }
  const repoPath = serverProjectConfig.repoPath;

  if (!syncLock.has(repoPath)) {
    syncLock.set(repoPath, false);
  }

  if (syncLock.get(repoPath) === true) {
    return NextResponse.json(
      {
        message: `Another Request in progress for the same repository: ${serverProjectConfig.owner}/${serverProjectConfig.repo}`,
      },
      { status: 400 },
    );
  }

  try {
    syncLock.set(repoPath, true);
    const lyraConfig = await LyraConfig.readFromDir(repoPath);
    const options: Partial<SimpleGitOptions> = {
      baseDir: repoPath,
      binary: 'git',
      maxConcurrentProcesses: 1,
      trimmed: false,
    };
    const git: SimpleGit = simpleGit(options);
    await git.checkout(lyraConfig.baseBranch);
    await git.pull();
    const projectConfig = lyraConfig.getProjectConfigByPath(
      serverProjectConfig.projectPath,
    );
    const projectStore = await Cache.getProjectStore(repoPath, projectConfig);
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
      serverProjectConfig.owner,
      serverProjectConfig.repo,
      serverProjectConfig.githubToken,
    );
    await git.checkout(lyraConfig.baseBranch);
    await git.pull();
    return NextResponse.json({
      branchName,
      pullRequestUrl,
    });
  } finally {
    syncLock.set(repoPath, false);
  }

  async function createPR(
    branchName: string,
    baseBranch: string,
    nowIso: string,
    githubOwner: string,
    githubRepo: string,
    githubToken: string,
  ): Promise<string> {
    const octokit = new Octokit({
      auth: githubToken,
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
      owner: githubOwner,
      repo: githubRepo,
      title: 'LYRA Translate PR: ' + nowIso,
    });

    return response.data.html_url;
  }
}
