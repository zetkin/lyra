import { NextResponse } from 'next/server';
import { ServerConfig } from '@/utils/config';
import { ServerConfigReadingError } from '@/errors';
import { type ProjectItem, type ProjectsResponse } from '@/types';

export async function GET() {
  try {
    const serverConfig = await ServerConfig.read();
    return NextResponse.json<ProjectsResponse>({
      projects: serverConfig.projects.map<ProjectItem>((project) => ({
        host: project.host,
        name: project.name,
        owner: project.owner,
        projectPath: project.projectPath,
        repo: project.repo,
      })),
    });
  } catch (e) {
    if (e instanceof ServerConfigReadingError) {
      return NextResponse.json({ message: e.message }, { status: 500 });
    }
    throw e;
  }
}
