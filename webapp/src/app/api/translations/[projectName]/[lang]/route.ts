import { Cache } from '@/Cache';
import { dehydrateMessageMap } from '@/utils/adapters';
import {
  LanguageNotFound,
  LanguageNotSupported,
  ProjectNameNotFoundError,
} from '@/errors';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest, // keep this here even if unused
  context: { params: { lang: string; projectName: string } },
) {
  const { projectName, lang } = context.params;
  try {
    const messageMap = await Cache.getLanguage(projectName, lang);
    const translations = dehydrateMessageMap(messageMap);
    return NextResponse.json({
      lang,
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
