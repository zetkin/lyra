import { Box } from '@mui/material';
import { NextPage } from 'next';
import { notFound } from 'next/navigation';

import Header from '@/components/Header';
import Main from '@/components/Main';
import Sidebar from '@/components/Sidebar';
import { Cache } from '@/Cache';
import MessageAdapterFactory from '@/utils/adapters/MessageAdapterFactory';
import { RepoGit } from '@/RepoGit';
import { ServerConfig, ServerProjectConfig } from '@/utils/serverConfig';
import MessageTree from '@/components/MessageTree';
import MessageList from '@/components/MessageList';
import PullRequestButton, {
  PullRequestState,
} from '@/components/PullRequestButton';

async function saveTranslation(
  projectName: string,
  languageName: string,
  messageId: string,
  translation: string,
) {
  'use server';

  const serverConfig = await ServerConfig.read();
  const project = serverConfig.projects.find(
    (project) => project.name === projectName,
  );
  if (!project) {
    return;
  }
  await RepoGit.cloneIfNotExist(project);
  const repoGit = await RepoGit.getRepoGit(project);
  const lyraConfig = await repoGit.getLyraConfig();
  const projectConfig = lyraConfig.getProjectConfigByPath(project.projectPath);
  if (!projectConfig.isLanguageSupported(languageName)) {
    return;
  }
  const projectStore = await Cache.getProjectStore(projectConfig);
  await projectStore.updateTranslation(languageName, messageId, translation);
}

/** used to prevent multiple requests from running at the same time */
const syncLock = new Map<string, boolean>();

async function sendPullRequest(projectName: string): Promise<PullRequestState> {
  'use server';

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
    const baseBranch = await repoGit.checkoutBaseAndPull();
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

const MessagesPage: NextPage<{
  params: { languageName: string; messageId?: string; projectName: string };
}> = async ({ params }) => {
  const { languageName, messageId, projectName } = params;

  const serverConfig = await ServerConfig.read();
  const project = serverConfig.projects.find(
    (project) => project.name === projectName,
  );

  if (!project) {
    return notFound();
  }

  await RepoGit.cloneIfNotExist(project);
  const repoGit = await RepoGit.getRepoGit(project);
  const lyraConfig = await repoGit.getLyraConfig();
  const projectConfig = lyraConfig.getProjectConfigByPath(project.projectPath);
  const msgAdapter = MessageAdapterFactory.createAdapter(projectConfig);
  const messages = await msgAdapter.getMessages();
  const translations = await Cache.getLanguage(projectName, languageName);

  const prefix = messageId ? messageId : '';
  const filteredMessages = messages.filter((message) =>
    message.id.startsWith(prefix),
  );
  filteredMessages.sort((m0, m1) => {
    const trans0 = translations[m0.id]?.trim() ?? '';
    const trans1 = translations[m1.id]?.trim() ?? '';

    if (!trans0) {
      return -1;
    } else if (trans1) {
      return 1;
    } else {
      return 0;
    }
  });

  return (
    <Box sx={{ display: 'flex', minHeight: '100dvh' }}>
      <Header />
      <Sidebar>
        <PullRequestButton
          projectName={projectName}
          sendPullRequest={sendPullRequest}
        />
        <MessageTree
          languageName={languageName}
          messageId={messageId}
          messages={messages}
          projectName={projectName}
        />
      </Sidebar>
      <Main>
        <MessageList
          languageName={languageName}
          messages={filteredMessages}
          projectName={projectName}
          saveTranslation={saveTranslation}
          translations={translations}
        />
      </Main>
    </Box>
  );
};

export default MessagesPage;
