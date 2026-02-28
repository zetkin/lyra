import { NextRequest, NextResponse } from 'next/server';

import { Promises } from '@/utils/Promises';
import { accessProject } from '@/dataAccess';

export type ProjectResponse = {
  languages: {
    href: string;
    language: string;
    messagesLeft: number;
    progress: number;
  }[];
  messageCount: number;
  name: string;
};

export async function GET(
  _req: NextRequest,
  context: { params: { projectName: string } },
): Promise<NextResponse> {
  const project = await accessProject(context.params.projectName);
  if (!project) {
    return NextResponse.json(
      { errorMessage: 'Not Found' },
      { status: 404 },
    );
  }
  const { name, messages, languagesWithTranslations } = project;
  const languages = await Promises.of(languagesWithTranslations)
    .map(({ lang, translations }) => ({
      href: `/projects/${name}/${lang}`,
      language: lang,
      messagesLeft: messages.length - Object.keys(translations).length,
      progress: translations
        ? (Object.keys(translations).length / messages.length) * 100
        : 0,
    }))
    .all();

  return NextResponse.json<ProjectResponse>({
    languages,
    messageCount: messages.length,
    name,
  });
}
