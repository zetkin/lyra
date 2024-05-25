type TypeID = string;

export type MessageData = {
  defaultMessage: string;
  id: string;
  params: {
    name: string;
    types: TypeID[];
  }[];
};

export type MessageTranslation = {
  sourceFile: string;
  text: string;
};

export type MessageMap = Record<
  string, // msg id
  MessageTranslation
>;

export type TranslationMap = Record<
  string, // lang
  MessageMap
>;

export interface IMessageAdapter {
  getMessages(): Promise<MessageData[]>;
}

export interface ITranslationAdapter {
  getTranslations(): Promise<TranslationMap>;
}

/** convert { [id]: { file, texts } } to { [id]: text } */
export function dehydrateMessageMap(
  translations: MessageMap,
): Record<string, string> {
  const output: Record<string, string> = {};
  Object.entries(translations).forEach(([id, { text }]) => {
    output[id] = text;
  });
  return output;
}

type TranslationFilenameMap = Record<
  string, // lang
  Record<
    string, // filename
    Record<
      string, // msg Id
      string // text
    >
  >
>;

/** convert TranslateMap to { [lang]: { [filename]: {[msgId]: text} } */
export function groupByFilename(
  translationMap: TranslationMap,
): TranslationFilenameMap {
  const output: TranslationFilenameMap = {};
  Object.entries(translationMap).forEach(([lang, messageMap]) => {
    Object.entries(messageMap).forEach(([msgId, { text, sourceFile }]) => {
      if (!output[lang]) {
        output[lang] = {};
      }
      if (!output[lang][sourceFile]) {
        output[lang][sourceFile] = {};
      }
      const msgIdArray = msgId.split('.').splice(sourceFile.split('/').length);
      const shortId = msgIdArray.join('.');
      output[lang][sourceFile][shortId] = text;
    });
  });
  return output;
}
