import {
  IMessageAdapter,
  ITranslationAdapter,
  MessageData,
  MessageMap,
  TranslationMap,
} from '@/utils/adapters';
import { LanguageNotFound, MessageNotFound } from '@/errors';
import { StoreData } from './types';
import mergeStoreData from './mergeStoreData';

export class ProjectStore {
  private data: StoreData;
  private translationAdapter: ITranslationAdapter;
  private messageAdapter: IMessageAdapter;

  constructor(
    messageAdapter: IMessageAdapter,
    translationAdapter: ITranslationAdapter,
    initialState?: StoreData,
  ) {
    this.data = initialState || {
      languages: {},
      messages: [],
    };

    this.translationAdapter = translationAdapter;
    this.messageAdapter = messageAdapter;
  }

  async getLanguageData(): Promise<TranslationMap> {
    await this.refresh();

    const output: TranslationMap = {};
    for await (const lang of Object.keys(this.data.languages)) {
      output[lang] = await this.getTranslations(lang);
    }

    return output;
  }

  async getTranslations(lang: string): Promise<MessageMap> {
    await this.refresh();

    const language = this.data.languages[lang];
    if (!language) {
      throw new LanguageNotFound(lang);
    }

    const output: MessageMap = {};
    Object.entries(language).forEach(([key, messageTranslation]) => {
      output[key] = { ...messageTranslation };
    });

    return output;
  }

  async getMessageIds(): Promise<MessageData[]> {
    await this.refresh();
    return this.data.messages;
  }

  toJSON(): StoreData {
    return this.data;
  }

  async updateTranslation(lang: string, id: string, text: string) {
    await this.refresh();

    if (!this.data.languages[lang]) {
      throw new LanguageNotFound(lang);
    }

    if (!this.data.languages[lang][id]) {
      throw new MessageNotFound(lang, id);
    }

    this.data.languages[lang][id].text = text;
  }

  private async refresh() {
    const fromRepo: StoreData = {
      languages: await this.translationAdapter.getTranslations(),
      messages: await this.messageAdapter.getMessages(),
    };

    this.data = mergeStoreData(this.data, fromRepo);
  }
}
