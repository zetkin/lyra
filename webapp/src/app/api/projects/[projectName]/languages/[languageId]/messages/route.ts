import { NextRequest, NextResponse } from 'next/server';

import { accessLanguage } from '@/dataAccess';
import { info, toHex, warn } from '@/utils/log';
import { MessageData, TranslateIdTextState } from '@/utils/adapters';

export type LanguageResponse = {
  messages: MessageData[];
  translations: TranslateIdTextState;
};

export async function GET(
  req: NextRequest,
  context: {
    params: { languageId: string; projectName: string };
  },
): Promise<NextResponse> {
  const { languageId, projectName } = context.params;
  const messageId = req.nextUrl.searchParams.get('messageId');

  let languageData;
  try {
    languageData = await accessLanguage(projectName, languageId);
  } catch (e) {
    return NextResponse.json({ errorMessage: 'Not Found' }, { status: 404 });
  }
  if (!languageData) {
    warn(
      `No language data found for project with code units ${toHex(projectName)}`,
    );
    return NextResponse.json({ errorMessage: 'Not Found' }, { status: 404 });
  }

  info(
    `Found ${languageData?.messages.length} messages for language '${languageId}' in project '${projectName}'`,
  );

  const { messages, translations } = languageData;
  const translationCount = Object.keys(translations).length;
  const percentage = Math.round((100 * translationCount) / messages.length);
  info(
    `Found ${translationCount} translations (${percentage}%) for language '${languageId}' in project '${projectName}'`,
  );

  const prefix = messageId ?? '';
  const filteredMessages = messages.filter((message) =>
    message.id.startsWith(prefix),
  );

  if (filteredMessages.length === 0) {
    return NextResponse.json({ errorMessage: 'Not Found' }, { status: 404 });
  }

  filteredMessages.sort((m0, m1) => {
    const trans0 = translations[m0.id]?.text.trim() ?? '';
    const trans1 = translations[m1.id]?.text.trim() ?? '';
    if (!trans0) {
      return -1;
    } else if (trans1) {
      return 1;
    } else {
      return 0;
    }
  });

  return NextResponse.json<LanguageResponse>({
    messages: filteredMessages,
    translations,
  });
}
