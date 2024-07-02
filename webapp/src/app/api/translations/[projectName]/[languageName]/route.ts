import { NextRequest, NextResponse } from 'next/server';

import { Cache } from '@/Cache';
import {
  LanguageNotFound,
  LanguageNotSupported,
  ProjectNameNotFoundError,
} from '@/errors';

export async function GET(
  req: NextRequest, // keep this here even if unused
  context: { params: { languageName: string; projectName: string } },
) {
  const { projectName, languageName } = context.params;
  try {
    const translations = await Cache.getLanguage(projectName, languageName);
    return NextResponse.json({
      languageName,
      translations,
    });
  } catch (e) {
    if (
      e instanceof LanguageNotFound ||
      e instanceof LanguageNotSupported ||
      e instanceof ProjectNameNotFoundError
    ) {
      return NextResponse.json({ message: e.message }, { status: 404 });
    }
    throw e;
  }
}
