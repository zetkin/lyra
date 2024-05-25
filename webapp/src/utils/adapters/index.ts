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
