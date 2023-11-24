import { NextRequest, NextResponse } from 'next/server';
import { getLanguage } from '@/app/api/languages';

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

  const objKeyPath = msgId.split('.');
  let curObj = await getLanguage(lang);
  objKeyPath.forEach((key, index) => {
    if (index == objKeyPath.length - 1) {
      curObj[key] = text;
    } else {
      curObj[key] = { ...(curObj[key] as Record<string, unknown>) };
      curObj = curObj[key] as Record<string, unknown>;
    }
  });

  return NextResponse.json({
    lang,
    msgId,
    text,
  });
}
