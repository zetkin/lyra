'use server';

import { notFound } from 'next/navigation';
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

export default async function sendPullRequest(
  projectName: string,
): Promise<PullRequestState> {
  let serverProjectConfig: ServerProjectConfig;
  try {
    serverProjectConfig = await ServerConfig.getProjectConfig(projectName);
  } catch (e) {
    return notFound();
  }
  const repoPath = serverProjectConfig.repoPath;

  if (!syncLock.has(repoPath)) {
    syncLock.set(repoPath, false);
  }

  if (syncLock.get(repoPath) === true) {
    return {
      errorMessage: `Another Request in progress for project: ${projectName} or a project that share same git repository`,
      pullRequestStatus: 'error',
    };
  }

  try {
    syncLock.set(repoPath, true);
    const repoGit = await RepoGit.getRepoGit(serverProjectConfig);
    const baseBranch = await repoGit.fetchAndCheckoutOriginBase();
    const langFilePaths = await repoGit.saveLanguageFiles(
      serverProjectConfig.projectPath,
    );

    if (!(await repoGit.statusChanged())) {
      return {
        errorMessage: `There are no changes in ${baseBranch} branch`,
        pullRequestStatus: 'error',
      };
    }

    const nowIso = new Date().toISOString().replace(/:/g, '').split('.')[0];
    const uuidSnippet = randomUUID().substring(5);
    const branchName = 'lyra-translate-' + uuidSnippet;

    await repoGit.newBranchCommitAndPush(
      branchName,
      langFilePaths,
      `Lyra translate: ${nowIso}-${uuidSnippet}`,
    );

    const pullRequestUrl = await repoGit.createPR(
      branchName,
      'LYRA Translate PR: ' + nowIso,
      'Created by LYRA at: ' + nowIso,
      serverProjectConfig.owner,
      serverProjectConfig.repo,
      serverProjectConfig.githubToken,
    );
    await repoGit.fetchAndCheckoutOriginBase();
    return {
      branchName,
      pullRequestStatus: 'success',
      pullRequestUrl,
    };
  } catch (e) {
    return {
      errorMessage: 'Error while creating pull request',
      pullRequestStatus: 'error',
    };
  } finally {
    syncLock.set(repoPath, false);
  }
}
