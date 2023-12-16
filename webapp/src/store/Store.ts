import { ITranslationAdapter, TranslationMap } from '@/utils/adapters';

export default class Store {
  private translationAdapter: ITranslationAdapter;

  constructor(translationAdapter: ITranslationAdapter) {
    this.translationAdapter = translationAdapter;
  }

  async getTranslations(lang: string): Promise<Record<string, string>> {
    const languages = await this.translationAdapter.getTranslations();
    const language = languages[lang] || {};

    const output: Record<string, string> = {};
    Object.entries(language).forEach(([key, value]) => {
      output[key] = value.text;
    });

    return output;
  }
}
