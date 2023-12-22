import MessageAdapterFactory from '@/utils/adapters/MessageAdapterFactory';
import { LyraConfig, ServerConfig } from '@/utils/config';
import { LyraConfigReadingError, ProjectNameNotFoundError, ProjectPathNotFoundError } from '@/errors';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  context: { params: { projectName: string } },
) {
  try {
    const projectName = context.params.projectName;
    const serverConfig = await ServerConfig.read();
    const serverProjectConfig = serverConfig.getProjectConfigByName(projectName);
    const lyraConfig = await LyraConfig.readFromDir(serverProjectConfig.localPath);
    const projectConfig = lyraConfig.getProjectConfigByPath(serverProjectConfig.subProjectPath);
    const msgAdapter = MessageAdapterFactory.createAdapter(projectConfig);
    const messages = await msgAdapter.getMessages();

    return NextResponse.json({
      data: messages,
    });
  } catch (e) {
    if (e instanceof LyraConfigReadingError) {
      return getResponse500('error while reading lyra config');
    } else if (e instanceof ProjectNameNotFoundError) {
      return getResponse404(e.message);
    } else if (e instanceof ProjectPathNotFoundError) {
      return getResponse500(e.message);
    }
    return getResponse500('error reading messages error');
  }
}

function getResponse404(message: string): NextResponse {
  return NextResponse.json({ message }, { status: 404 });
}

function getResponse500(message: string): NextResponse {
  return NextResponse.json({ message }, { status: 500 });
}
