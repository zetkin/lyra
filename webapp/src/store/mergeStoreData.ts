import { StoreData } from './types';

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

  Object.values(output.messages).forEach((message) => {
    allLanguages.forEach((lang) => {
      if (!output.languages[lang]) {
        output.languages[lang] = {};
      }

      output.languages[lang][message.id] =
        inMemory.languages[lang]?.[message.id] ||
        fromRepo.languages[lang]?.[message.id];
    });
  });

  return output;
}
