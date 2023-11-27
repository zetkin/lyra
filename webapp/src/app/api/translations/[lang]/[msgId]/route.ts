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

  const translations = await Store.getLanguage(lang);
  // TODO: in case msgId is not found ?!
  translations[msgId] = text;

  return NextResponse.json({
    lang,
    msgId,
    text,
  });
}
