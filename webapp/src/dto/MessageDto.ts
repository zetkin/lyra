import { TranslateState } from '@/dao/types';

type TypeID = string;

type MessageParams = {
  name: string;
  types: TypeID[];
};

type Translation = {
  language: string;
  state: TranslateState;
  text: string;
};

export type MessageDto = {
  defaultMessage: string;
  i18nKey: string;
  params: MessageParams[];
  translations: Translation[];
};
