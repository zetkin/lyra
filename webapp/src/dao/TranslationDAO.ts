import { BaseDAO } from './db';
import { TranslateState, Translation } from './types';

export class TranslationDAO extends BaseDAO {
  static find(keyId: number, langId: string): Translation | undefined {
    return this.db
      .prepare(
        'SELECT id, key, lang, text, state FROM translation WHERE key = ? AND lang = ?',
      )
      .get(keyId, langId) as Translation | undefined;
  }

  static upsert(
    keyId: number,
    langId: string,
    text: string,
    state: TranslateState,
  ): Translation {
    this.db
      .prepare(
        `INSERT INTO translation (key, lang, text, state) VALUES ($key, $lang, $text, $state)
         ON CONFLICT(key, lang) DO UPDATE SET text = excluded.text, state = excluded.state`,
      )
      .run({ key: keyId, lang: langId, state: state, text: text });
    return this.db
      .prepare(
        'SELECT id, key, lang, text, state FROM translation WHERE key = ? AND lang = ?',
      )
      .get(keyId, langId) as Translation;
  }

  static findByProject(
    projectId: number,
    langId: string,
  ): Array<{ key: string; path: string; state: TranslateState; text: string }> {
    return this.db
      .prepare(
        `SELECT p.value AS path, k.value AS key, t.text, t.state
         FROM translation t
         LEFT JOIN i18n_key k ON k.id = t.key
         LEFT JOIN path p ON p.id = k.path
         WHERE p.project = ? AND t.lang = ?`,
      )
      .all(projectId, langId) as Array<{
      key: string;
      path: string;
      state: TranslateState;
      text: string;
    }>;
  }

  static countTranslationForProjectForLanguage(
    projectId: number,
    langId: string,
  ): number {
    const result = this.db
      .prepare(
        `SELECT COUNT(1) AS c
         FROM translation t
         LEFT JOIN i18n_key k ON k.id = t.key
         LEFT JOIN path p ON p.id = k.path
      
         WHERE p.project = ? AND t.lang = ?`,
      )
      .all(projectId, langId) as Array<{ c: number }>;

    return (result?.length ?? 0) > 0 ? result[0].c : 0;
  }
}
