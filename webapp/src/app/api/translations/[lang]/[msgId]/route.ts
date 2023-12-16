import { Cache } from '@/Cache';
import { LanguageNotFound, MessageNotFound } from '@/errors';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(
  req: NextRequest,
  context: {
    params: {
      lang: string;
      msgId: string;
    };
  }
) {
  const payload = await req.json();
  const { lang, msgId } = context.params;
  const { text } = payload;

  try {
    const store = await Cache.getStore();
    await store.updateTranslation(lang, msgId, text);
  } catch (e) {
    if (e instanceof LanguageNotFound || e instanceof MessageNotFound) {
      return NextResponse.json({ message: e.message }, { status: 404 });
    }
    throw e;
  }

  return NextResponse.json({
    lang,
    msgId,
    text,
  });
}
