import { Octokit } from '@octokit/rest';
import packageJson from '../package.json';
import { debug, info, warn } from '@/utils/log';

export async function createPR(
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
