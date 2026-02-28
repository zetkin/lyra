import { BaseDAO } from './db';
import { I18nKey } from './types';

export class I18nDAO extends BaseDAO {
  findByPath(pathId: number): I18nKey[] {
    return this.db
      .prepare('SELECT id, path, value, default_text, params FROM i18n_key WHERE path = ?')
      .all(pathId) as I18nKey[];
  }

  upsert(pathId: number, value: string, defaultText: string, params: string | null): I18nKey {
    this.db
      .prepare(
        `INSERT INTO i18n_key (path, value, default_text, params) VALUES ($path, $value, $default_text, $params)
         ON CONFLICT(path, value) DO UPDATE SET default_text = excluded.default_text, params = excluded.params`,
      )
      .run({ $default_text: defaultText, $params: params, $path: pathId, $value: value });
    return this.db
      .prepare('SELECT id, path, value, default_text, params FROM i18n_key WHERE path = ? AND value = ?')
      .get(pathId, value) as I18nKey;
  }
}