type TypeID = string;

export type MessageData = {
  defaultMessage: string;
  id: string;
  params: {
    name: string;
    types: TypeID[];
  }[];
};

export type TranslationMap = Record<
  string,
  Record<
    string,
    {
      text: string;
      sourceFile: string;
    }
  >
>;

export interface IMessageAdapter {
  getMessages(): Promise<MessageData[]>;
}
