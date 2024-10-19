import {
  IMessageAdapter,
  ITranslationAdapter,
  MessageData,
  MessageMap,
  TranslationMap,
} from '@/utils/adapters';
import { LanguageNotFound } from '@/errors';
import { StoreData } from './types';
import mergeStoreData from './mergeStoreData';

export class ProjectStore {
  private data: StoreData;
  private readonly translationAdapter: ITranslationAdapter;
  private readonly messageAdapter: IMessageAdapter;

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

  async getMessages(): Promise<MessageData[]> {
    await this.refresh();
    return this.data.messages;
  }

  async updateTranslation(lang: string, id: string, text: string) {
    await this.refresh();

    if (!this.data.languages[lang]) {
      throw new LanguageNotFound(lang);
    }

    if (!this.data.languages[lang][id]) {
      const sourceFile = this.generateSourceFile(lang, id);
      this.data.languages[lang][id] = { sourceFile, text };
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

  /** get the source file from the default en language otherwise generate one from locale root*/
  private generateSourceFile(lang: string, messageId: string): string {
    const enSourceFile = this.data.languages?.['en']?.[messageId]?.sourceFile;
    if (!enSourceFile) {
      return `${lang}.yml`;
    }
    /** for example if lang = sv then replace "en" to "sv" ex. "folder1/en.yaml" -> "folder1/sv.yaml" */
    const enSourceFileArr = enSourceFile.split('/');
    const enShortFileName = enSourceFileArr.pop();
    if (!enShortFileName) {
      return `${lang}.yml`;
    }
    const langFileName = enShortFileName.replace(
      /^en\.(.+\.)*(ya?ml)$/g,
      `${lang}.$1$2`,
    );
    return enSourceFileArr.join('/').concat(`/${langFileName}`);
  }
}
