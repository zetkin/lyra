import { BaseDAO } from './db';
import { I18nKey } from './types';

export class I18nDAO extends BaseDAO {
  static findByPath(pathId: number): I18nKey[] {
    return BaseDAO.db
      .prepare(
        'SELECT id, path, value, default_text, params FROM i18n_key WHERE path = ?',
      )
      .all(pathId) as I18nKey[];
  }

  static countByProject(projectId: number): number {
    const row = BaseDAO.db
      .prepare(
        `SELECT COUNT(1) as count
         FROM i18n_key k
                LEFT JOIN path p ON k.path = p.id
          WHERE p.project = ?`,
      )
      .get(projectId) as { count: number };

    return row.count;
  }

  static upsert(
    pathId: number,
    value: string,
    defaultText: string,
    params: string | null,
  ): I18nKey {
    BaseDAO.db
      .prepare(
        `INSERT INTO i18n_key (path, value, default_text, params) VALUES ($path, $value, $default_text, $params)
         ON CONFLICT(path, value) DO UPDATE SET default_text = excluded.default_text, params = excluded.params`,
      )
      .run({
        default_text: defaultText,
        params: params,
        path: pathId,
        value: value,
      });
    return this.db
      .prepare(
        'SELECT id, path, value, default_text, params FROM i18n_key WHERE path = ? AND value = ?',
      )
      .get(pathId, value) as I18nKey;
  }
}
