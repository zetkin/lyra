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
  string, // lang code, ex: 'en', 'de'
  MessageMap
>;

export type TranslateIdText = Record<string, string>;
export type TranslateBySourceFile = Record<string, TranslateIdText>;

export interface IMessageAdapter {
  getMessages(): Promise<MessageData[]>;
}

export interface ITranslationAdapter {
  getTranslations(): Promise<TranslationMap>;
}
