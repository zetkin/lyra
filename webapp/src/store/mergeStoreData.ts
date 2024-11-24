import { StoreData } from './types';
import { MessageTranslation } from '@/utils/adapters';

export default function mergeStoreData(
  inMemory: StoreData,
  fromRepo: StoreData,
): StoreData {
  const output: StoreData = {
    languages: {},
    messages: fromRepo.messages,
  };

  const allLanguages = Array.from(
    new Set([
      ...Object.keys(inMemory.languages),
      ...Object.keys(fromRepo.languages),
    ]),
  );

  Object.keys(fromRepo.languages).forEach((lang) => {
    output.languages[lang] = {};
  });

  Object.values(output.messages).forEach((message) => {
    allLanguages.forEach((lang) => {
      if (!output.languages[lang]) {
        output.languages[lang] = {};
      }

      const messageTranslation: MessageTranslation =
        inMemory.languages[lang]?.[message.id] ||
        fromRepo.languages[lang]?.[message.id];

      if (messageTranslation) {
        output.languages[lang][message.id] = messageTranslation;
      }
    });
  });

  return output;
}
