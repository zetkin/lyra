import { Cache } from '@/Cache';
import { LyraConfig } from '@/utils/lyraConfig';
import { ProjectNameNotFoundError } from '@/errors';
import { createPR, writeLangFiles } from '@/git';
import { NextRequest, NextResponse } from 'next/server';
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
    // TODO: move logic from here to a separate class
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
    const langFilePaths = await writeLangFiles(
      languages,
      projectConfig.absTranslationsPath,
    );
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
    // TODO: to here
    return NextResponse.json({
      branchName,
      pullRequestUrl,
    });
  } finally {
    syncLock.set(repoPath, false);
  }
}
