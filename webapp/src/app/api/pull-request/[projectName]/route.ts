import { ProjectNameNotFoundError } from '@/errors';
import { RepoGit } from '@/RepoGit';
import { NextRequest, NextResponse } from 'next/server';
import { ServerConfig, ServerProjectConfig } from '@/utils/serverConfig';

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
    const repoGit = new RepoGit(serverProjectConfig);
    const baseBranch = await repoGit.checkoutBaseAndPull();
    const langFilePaths = await repoGit.saveLanguageFiles(
      serverProjectConfig.projectPath,
    );

    if (!(await repoGit.statusChanged())) {
      return NextResponse.json(
        { message: `There are no changes in ${baseBranch} branch` },
        { status: 400 },
      );
    }

    const nowIso = new Date().toISOString().replace(/:/g, '').split('.')[0];
    const branchName = 'lyra-translate-' + nowIso;
    await repoGit.newBranchCommitAndPush(
      branchName,
      langFilePaths,
      `Lyra translate: ${nowIso}`,
    );

    const pullRequestUrl = await repoGit.createPR(
      branchName,
      'LYRA Translate PR: ' + nowIso,
      'Created by LYRA at: ' + nowIso,
      serverProjectConfig.owner,
      serverProjectConfig.repo,
      serverProjectConfig.githubToken,
    );
    await repoGit.checkoutBaseAndPull();
    return NextResponse.json({
      branchName,
      pullRequestUrl,
    });
  } finally {
    syncLock.set(repoPath, false);
  }
}
