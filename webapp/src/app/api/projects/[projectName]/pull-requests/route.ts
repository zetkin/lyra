import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

import { RepoGit } from '@/RepoGit';
import { ServerConfig, ServerProjectConfig } from '@/utils/serverConfig';

/** used to prevent multiple requests from running at the same time */
const syncLock = new Map<string, boolean>();

type PullRequestCreated = {
  branchName: string;
  pullRequestStatus: 'success';
  pullRequestUrl: string;
};

type PullRequestError = {
  errorMessage: string;
  pullRequestStatus: 'error';
};

type PullRequestIdle = {
  pullRequestStatus: 'idle';
};

type PullRequestSending = {
  pullRequestStatus: 'sending';
};

export type PullRequestState =
  | PullRequestIdle
  | PullRequestSending
  | PullRequestCreated
  | PullRequestError;

export async function POST(
  req: NextRequest,
  context: { params: { projectName: string } },
): Promise<NextResponse<PullRequestState>> {
  const projectName = context.params.projectName;
  let serverProjectConfig: ServerProjectConfig;
  try {
    serverProjectConfig = await ServerConfig.getProjectConfig(projectName);
  } catch (e) {
    return NextResponse.json(
      { errorMessage: 'Not Found', pullRequestStatus: 'error' },
      { status: 404 },
    );
  }
  const repoPath = serverProjectConfig.repoPath;

  if (!syncLock.has(repoPath)) {
    syncLock.set(repoPath, false);
  }

  if (syncLock.get(repoPath) === true) {
    return NextResponse.json({
      errorMessage: `Another Request in progress for project: ${projectName} or a project that share same git repository`,
      pullRequestStatus: 'error',
    });
  }

  try {
    syncLock.set(repoPath, true);
    const repoGit = await RepoGit.get(serverProjectConfig);
    const baseBranch = await repoGit.fetchAndCheckoutOriginBase();
    const langFilePaths = await repoGit.saveLanguageFiles(
      serverProjectConfig.projectPath,
    );

    if (!(await repoGit.statusChanged())) {
      return NextResponse.json({
        errorMessage: `There are no changes in ${baseBranch} branch`,
        pullRequestStatus: 'error',
      });
    }

    const nowIso = new Date().toISOString().replace(/:/g, '').split('.')[0];
    const uuidSnippet = randomUUID().substring(5);
    const branchName = 'lyra-translate-' + uuidSnippet;

    await repoGit.newBranchCommitAndPush(
      branchName,
      langFilePaths,
      `Lyra translate: ${nowIso}-${uuidSnippet}`,
    );

    const pullRequestUrl = await repoGit.createPR({
      body: 'Created by LYRA at: ' + nowIso,
      branchName: branchName,
      githubOwner: serverProjectConfig.owner,
      githubRepo: serverProjectConfig.repo,
      githubToken: serverProjectConfig.githubToken,
      title: 'LYRA Translate PR: ' + nowIso,
    });
    await repoGit.fetchAndCheckoutOriginBase();
    return NextResponse.json({
      branchName,
      pullRequestStatus: 'success',
      pullRequestUrl,
    });
  } catch (e) {
    return NextResponse.json({
      errorMessage: `Error while creating pull request: ${e}`,
      pullRequestStatus: 'error',
    });
  } finally {
    syncLock.set(repoPath, false);
  }
}
