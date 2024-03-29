import MessageAdapterFactory from '@/utils/adapters/MessageAdapterFactory';
import { RepoGit } from '@/RepoGit';
import { ServerConfig } from '@/utils/serverConfig';
import {
  LyraConfigReadingError,
  ProjectNameNotFoundError,
  ProjectPathNotFoundError,
} from '@/errors';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  context: { params: { projectName: string } },
) {
  try {
    const projectName = context.params.projectName;
    const serverProjectConfig =
      await ServerConfig.getProjectConfig(projectName);
    await RepoGit.cloneIfNotExist(serverProjectConfig);
    const repoGit = await RepoGit.getRepoGit(serverProjectConfig);
    const lyraConfig = await repoGit.getLyraConfig();
    const projectConfig = lyraConfig.getProjectConfigByPath(
      serverProjectConfig.projectPath,
    );
    const msgAdapter = MessageAdapterFactory.createAdapter(projectConfig);
    const messages = await msgAdapter.getMessages();

    return NextResponse.json({
      data: messages,
    });
  } catch (e) {
    if (e instanceof LyraConfigReadingError) {
      return getResponse500('Error while reading lyra config');
    } else if (e instanceof ProjectNameNotFoundError) {
      return getResponse404(e.message);
    } else if (e instanceof ProjectPathNotFoundError) {
      return getResponse500(e.message);
    }
    return getResponse500('Error while reading messages');
  }
}

function getResponse404(message: string): NextResponse {
  return NextResponse.json({ message }, { status: 404 });
}

function getResponse500(message: string): NextResponse {
  return NextResponse.json({ message }, { status: 500 });
}
