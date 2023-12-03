import { getLanguage } from '@/app/api/languages';
import flattenObject from '@/utils/flattenObject';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest, // keep this here even if unused
  context: { params: { lang: string; msgId: string } },
) {
  const lang = context.params.lang;
  const langObj = await getLanguage(lang);
  const flattenLangObj = flattenObject(langObj);

  return NextResponse.json({
    lang,
    translations: flattenLangObj,
  });
}
