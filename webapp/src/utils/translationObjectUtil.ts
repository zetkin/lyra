import {
  MessageMap,
  TranslateBySourceFile,
  TranslateIdText,
} from '@/utils/adapters';

/**
 * get a basic object of message id and text from MessageMap, by remove sourceFile and keep text
 * ex: { 'a.b.c': {sourceFile, text} } => { 'a.b.c': 'text' }
 */
export function getTranslationsIdText(messageMap: MessageMap): TranslateIdText {
  const result: TranslateIdText = {};
  Object.entries(messageMap).forEach(([id, mt]) => {
    result[id] = mt.text;
  });
  return result;
}

/**
 * get an object of message id and text from MessageMap, by group by sourceFile
 * ex: { 'a.b.c': {sourceFile, text}, ... } => { 'sourceFile': { 'a.b.c': 'text', ... }, ... }
 * @param messageMap
 */
export function getTranslationsBySourceFile(
  messageMap: MessageMap,
): TranslateBySourceFile {
  return Object.entries(messageMap).reduce((acc, [id, mt]) => {
    if (!acc[mt.sourceFile]) {
      acc[mt.sourceFile] = {};
    }
    acc[mt.sourceFile][id] = mt.text;
    return acc;
  }, {} as TranslateBySourceFile);
}
