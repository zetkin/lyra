import { Cache } from '@/Cache';
import { LanguageNotFound, ProjectNameNotFoundError } from '@/errors';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest, // keep this here even if unused
  context: { params: { lang: string; projectName: string } },
) {
  const { projectName, lang } = context.params;
  try {
    const translations = await Cache.getLanguage(projectName, lang);
    return NextResponse.json({
      lang,
      translations,
    });
  } catch (e) {
    if (e instanceof LanguageNotFound) {
      return NextResponse.json(
        { message: 'language [' + lang + '] not found' },
        { status: 404 },
      );
    } else if (e instanceof ProjectNameNotFoundError) {
      return NextResponse.json(
        { message: 'Project name [' + projectName + '] not found' },
        { status: 404 },
      );
    }
    throw e;
  }
}
