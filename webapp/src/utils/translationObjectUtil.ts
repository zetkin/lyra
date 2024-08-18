import { MessageMap } from '@/utils/adapters';

/**
 * get basic object of message id and text from MessageMap, by remove sourceFile and keep text
 * ex: { 'a.b.c': {sourceFile, text} } => { 'a.b.c': 'text' } } }
 */
export function getTranslationsIdText(
  messageMap: MessageMap,
): Record<string, string> {
  const result: Record<string, string> = {};
  Object.entries(messageMap).forEach(([id, mt]) => {
    result[id] = mt.text;
  });
  return result;
}
