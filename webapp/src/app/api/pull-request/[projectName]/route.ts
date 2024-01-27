import { Cache } from '@/Cache';
import fs from 'fs/promises';
import { LyraConfig } from '@/utils/lyraConfig';
import { Octokit } from '@octokit/rest';
import packageJson from '@/../package.json';
import path from 'path';
import { stringify } from 'yaml';
import { unflatten } from 'flat';
import { debug, info, warn } from '@/utils/log';
import { NextRequest, NextResponse } from 'next/server';
import { ProjectNameNotFoundError, WriteLanguageFileError, WriteLanguageFileErrors } from '@/errors';
import { ServerConfig, ServerProjectConfig } from '@/utils/serverConfig';
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
        message: `Another Request in progress for project: ${projectName} or a project that share same git repository`,
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
    const projectStore = await Cache.getProjectStore(projectConfig);
    const languages = await projectStore.getLanguageData();
    const langFilePaths = await writeLangFiles(languages, projectConfig.absTranslationsPath);
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
    await git.add(langFilePaths);
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

  async function writeLangFiles(
    languages: Record<string, Record<string, string>>,
    translationsPath: string,
  ): Promise<string[]> {
    const paths: string[] = [];
    const result = await Promise.allSettled(
      Object.keys(languages).map(async (lang) => {
        const yamlPath = path.join(
          translationsPath,
          // TODO: what if language file were yaml not yml?
          `${lang}.yml`,
        );
        const yamlOutput = stringify(unflatten(languages[lang]), {
          doubleQuotedAsJSON: true,
          singleQuote: true,
        });
        try {
          await fs.writeFile(yamlPath, yamlOutput);
        } catch (e) {
          throw new WriteLanguageFileError(yamlPath, e)
        }
        paths.push(yamlPath);
      }),
    );
    if (result.some((r) => r.status === 'rejected')) {
      throw new WriteLanguageFileErrors(
          result
            .filter((r) => r.status === 'rejected')
            .map((r) => (r as PromiseRejectedResult).reason)
      );
    }
    return paths;
  }
}
