import { NextRequest, NextResponse } from 'next/server';

import { Promises } from '@/utils/Promises';
import { accessProjects } from '@/dataAccess';
import { ProjectCardProps } from '@/components/ProjectCard';

type ProjectsResponse = ProjectCardProps[];

export async function GET(): Promise<NextResponse<ProjectsResponse>> {
  const projectData = await accessProjects();

  const projects = await Promises.of(projectData)
    .map(async ({ name, messages, languagesWithTranslations }) => {
      const languages = await Promises.of(languagesWithTranslations)
        .map(({ lang, translations }) => ({
          href: `/projects/${name}/${lang}`,
          language: lang,
          progress: translations
            ? (Object.keys(translations).length / messages.length) * 100
            : 0,
        }))
        .all();

      return {
        href: `/projects/${name}`,
        languages,
        messageCount: messages.length,
        name,
      };
    })

    .all();

  return NextResponse.json(projects);
}
