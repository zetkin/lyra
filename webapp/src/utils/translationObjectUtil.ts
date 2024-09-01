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
    const idWithoutPrefix = removePrefix(mt.sourceFile, id);
    acc[mt.sourceFile][idWithoutPrefix] = mt.text;
    return acc;
  }, {} as TranslateBySourceFile);
}

/**
 * get prefix key from sourceFile by removing filename and extension and replace '/' with '.'
 * ex: 'sub1/sub2/en.yaml' => 'sub1.sub2.'
 * @param messageMap
 */
export function getPrefixKeyFromSourceFile(sourceFile: string): string {
  const fileName = sourceFile.split('/').pop();
  if (!fileName) {
    return '';
  }
  return sourceFile.replace(fileName, '').replace(/\//g, '.');
}

/**
 * get key without a prefix based on sourceFile path
 * ex: 'sub1/sub2/en.yaml', 'sub1.sub2.k1.k2.k3 => 'k1.k2.k3'
 * @param sourceFile
 * @param fullKey
 */
export function removePrefix(sourceFile: string, fullKey: string): string {
  const prefix = getPrefixKeyFromSourceFile(sourceFile);
  return fullKey.replace(prefix, '').replace(/^\./, '');
}
