import { ITranslationAdapter, TranslationMap } from '@/utils/adapters';

type StoreData = {
  languages: TranslationMap;
};

export default class Store {
  private data: StoreData;
  private translationAdapter: ITranslationAdapter;

  constructor(translationAdapter: ITranslationAdapter) {
    this.data = {
      languages: {},
    };

    this.translationAdapter = translationAdapter;
  }

  async getTranslations(lang: string): Promise<Record<string, string>> {
    if (Object.keys(this.data.languages).length == 0) {
      this.data.languages = await this.translationAdapter.getTranslations();
    }

    const language = this.data.languages[lang] || {};

    const output: Record<string, string> = {};
    Object.entries(language).forEach(([key, value]) => {
      output[key] = value.text;
    });

    return output;
  }

  async updateTranslation(lang: string, id: string, text: string) {
    this.data.languages[lang][id].text = text;
  }
}
