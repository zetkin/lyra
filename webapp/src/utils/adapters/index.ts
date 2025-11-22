type TypeID = string;

export type MessageData = {
  defaultMessage: string;
  id: string;
  params: {
    name: string;
    types: TypeID[];
  }[];
};

export enum TranslateState {
  UPDATED = 'UPDATED',
  PUBLISHED = 'PUBLISHED',
}

export type MessageTranslation = {
  sourceFile: string;
  state: TranslateState;
  text: string;
  timestamp?: number; // optional timestamp for tracking changes
};

export type MessageMap = Record<
  string, // msg id
  MessageTranslation
>;

export type TranslationMap = Record<
  string, // lang code, ex: 'en', 'de'
  MessageMap
>;

export type TextState = {
  state: TranslateState;
  text: string;
};
export type TranslateIdTextState = Record<string, TextState>;
export type TranslateBySourceFile = Record<string, TranslateIdTextState>;

export interface IMessageAdapter {
  getMessages(): Promise<MessageData[]>;
}

export interface ITranslationAdapter {
  getTranslations(): Promise<TranslationMap>;
}
