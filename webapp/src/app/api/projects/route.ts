import { NextResponse } from 'next/server';

import { ProjectDto } from '@/dto/ProjectDto';
import { ProjectService } from '@/services/ProjectService';

export const dynamic = 'force-dynamic';

const projectService = new ProjectService();

export async function GET(): Promise<NextResponse<ProjectDto[]>> {
  const projectData = projectService.getProjects();
  return NextResponse.json(projectData);
}
