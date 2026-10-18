import { NextRequest, NextResponse } from 'next/server';

import { info, toHex, warn } from '@/utils/log';
import { MessageDto } from '@/dto/MessageDto';
import { MessageService } from '@/services/MessageService';

export type ErrorDto = {
  errorMessage: string;
  status: number;
};

const messageService = new MessageService();

export async function GET(
  req: NextRequest,
  context: {
    params: { languageId: string; projectName: string };
  },
): Promise<NextResponse<MessageDto[] | ErrorDto>> {
  const { languageId, projectName } = context.params;
  const messageData = messageService.getMessages(projectName, languageId);
  if (messageData.length == 0) {
    warn(
      `No language data found for project with code units ${toHex(projectName)}`,
    );
    return NextResponse.json({ errorMessage: 'Not Found', status: 404 });
  }

  info(
    `Found ${messageData.length} messages for language '${languageId}' in project '${projectName}'`,
  );
  let translationCount = 0;
  messageData.forEach((message) => {
    const translationsInLang = message.translations.filter(
      (t) => t.language === languageId,
    );
    translationCount += translationsInLang.length;
  });

  const percentage = Math.round((100 * translationCount) / messageData.length);
  info(
    `Found ${translationCount} translations (${percentage}%) for language '${languageId}' in project '${projectName}'`,
  );

  // ensure to sort untranslated messages first, so that translators can easily find them
  messageData.sort((m0, m1) => {
    const trans0 = m0.translations.filter((t) => t.language === languageId);
    const trans1 = m1.translations.filter((t) => t.language === languageId);
    if (trans0.length === 0) {
      return -1;
    } else if (trans1.length > 0) {
      return 1;
    } else {
      return 0;
    }
  });

  return NextResponse.json(messageData);
}
