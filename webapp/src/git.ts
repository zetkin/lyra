import fs from 'fs/promises';
import { Octokit } from '@octokit/rest';
import packageJson from '../package.json';
import path from 'path';
import { stringify } from 'yaml';
import { unflatten } from 'flat';
import { debug, info, warn } from '@/utils/log';
import { WriteLanguageFileError, WriteLanguageFileErrors } from '@/errors';

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

export async function writeLangFiles(
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
