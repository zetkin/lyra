import { Cache } from '@/Cache';
import { LanguageNotFound } from '@/errors';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest, // keep this here even if unused
  context: { params: { lang: string; msgId: string } },
) {
  const lang = context.params.lang;
  try {
    const translations = await Cache.getLanguage(lang);
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
    }
    throw e;
  }
}
