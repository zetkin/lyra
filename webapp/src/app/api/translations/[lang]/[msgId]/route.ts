import { LanguageNotFound } from '@/app/api/Errors';
import { Store } from '@/app/api/Store';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(
  req: NextRequest,
  context: {
    params: {
      lang: string;
      msgId: string;
    };
  },
) {
  const payload = await req.json();
  const { lang, msgId } = context.params;
  const { text } = payload;

  try {
    const translations = await Store.getLanguage(lang);
    if (translations[msgId] === undefined) {
      return NextResponse.json(
        { message: 'message id [' + msgId + '] not found' },
        { status: 404 },
      );
    }
    translations[msgId] = text;
  } catch (e) {
    if (e instanceof LanguageNotFound) {
      return NextResponse.json(
        { message: 'language [' + lang + '] not found' },
        { status: 404 },
      );
    }
    throw e;
  }

  return NextResponse.json({
    lang,
    msgId,
    text,
  });
}
