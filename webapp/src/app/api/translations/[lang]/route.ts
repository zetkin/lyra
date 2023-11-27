import { Store } from '@/app/api/Store';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest, // keep this here even if unused
  context: { params: { lang: string; msgId: string } },
) {
  const lang = context.params.lang;
  const translations = await Store.getLanguage(lang);

  return NextResponse.json({
    lang,
    translations,
  });
}
