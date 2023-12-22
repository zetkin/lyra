import path from 'path';
import { ITranslationAdapter, TranslationMap } from '@/utils/adapters';
import { LanguageNotFound, MessageNotFound } from '@/errors';

type StoreData = {
  languages: TranslationMap;
};

export class Store {
  private data = new Map<string, ProjectStore>();

  public addProjectStore(repoPath: string, projectPath: string, projectStore: ProjectStore) {
    this.data.set(path.join(repoPath, projectPath), projectStore);
  }

  public hasProjectStore(repoPath: string, projectPath: string): boolean {
    return this.data.has(path.join(repoPath, projectPath));
  }

  public getProjectStore(repoPath: string, projectPath: string): ProjectStore {
    const storePath = path.join(repoPath, projectPath);
    const projectStore = this.data.get(storePath);
    if (!projectStore) {
      // TODO: create new Error class
      throw new Error(`ProjectStore not found for path: ${storePath}`);
    }
    return projectStore;
  }
}

export class ProjectStore {
  private data: StoreData;
  private translationAdapter: ITranslationAdapter;

  constructor(translationAdapter: ITranslationAdapter) {
    this.data = {
      languages: {},
    };

    this.translationAdapter = translationAdapter;
  }

  async getLanguageData(): Promise<Record<string, Record<string, string>>> {
    await this.initIfNecessary();

    const output: Record<string, Record<string, string>> = {};
    for await (const lang of Object.keys(this.data.languages)) {
      output[lang] = await this.getTranslations(lang);
    }

    return output;
  }

  async getTranslations(lang: string): Promise<Record<string, string>> {
    await this.initIfNecessary();

    const language = this.data.languages[lang];
    if (!language) {
      throw new LanguageNotFound(lang);
    }

    const output: Record<string, string> = {};
    Object.entries(language).forEach(([key, value]) => {
      output[key] = value.text;
    });

    return output;
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
