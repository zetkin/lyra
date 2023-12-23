import { NextResponse } from 'next/server';
import { ServerConfig } from '@/utils/config';
import { ServerConfigReadingError } from '@/errors';

export async function GET() {
  try {
    const serverConfig = await ServerConfig.read();
    return NextResponse.json({
      projects: serverConfig.projects.map((project) => ({
        host: project.host,
        name: project.name,
        owner: project.owner,
        repo: project.repo,
        subProjectPath: project.subProjectPath,
      })),
    });
  } catch (e) {
    if (e instanceof ServerConfigReadingError) {
      return NextResponse.json({ message: e.message }, { status: 500 });
    }
    throw e;
  }
}
