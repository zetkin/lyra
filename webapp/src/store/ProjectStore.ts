import {
  IMessageAdapter,
  ITranslationAdapter,
  MessageData,
  MessageMap,
  TranslationMap,
} from '@/utils/adapters';
import { LanguageNotFound, MessageNotFound } from '@/errors';
import { StoreData } from './types';

export class ProjectStore {
  private data: StoreData;
  private translationAdapter: ITranslationAdapter;
  private messageAdapter: IMessageAdapter;

  constructor(
    messageAdapter: IMessageAdapter,
    translationAdapter: ITranslationAdapter,
  ) {
    this.data = {
      languages: {},
      messages: [],
    };

    this.translationAdapter = translationAdapter;
    this.messageAdapter = messageAdapter;
  }

  async getLanguageData(): Promise<TranslationMap> {
    await this.initIfNecessary();

    const output: TranslationMap = {};
    for await (const lang of Object.keys(this.data.languages)) {
      output[lang] = await this.getTranslations(lang);
    }

    return output;
  }

  async getTranslations(lang: string): Promise<MessageMap> {
    await this.initIfNecessary();

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
    this.data.messages = await this.messageAdapter.getMessages();
    return this.data.messages;
  }

  async updateTranslation(lang: string, id: string, text: string) {
    await this.initIfNecessary();

    if (!this.data.languages[lang]) {
      throw new LanguageNotFound(lang);
    }

    if (!this.data.languages[lang][id]) {
      throw new MessageNotFound(lang, id);
    }

    this.data.languages[lang][id].text = text;
  }

  private async initIfNecessary() {
    if (Object.keys(this.data.languages).length == 0) {
      this.data.languages = await this.translationAdapter.getTranslations();
    }
  }
}
