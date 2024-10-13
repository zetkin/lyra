import { MessageData, TranslationMap } from '@/utils/adapters';

export type StoreData = {
  languages: TranslationMap;
  messages: MessageData[];
};
