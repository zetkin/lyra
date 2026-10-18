import { BaseDAO } from './db';
import { Lang } from './types';

export class LangDAO extends BaseDAO {
  findAll(): Lang[] {
    return this.db.prepare('SELECT id, name FROM lang').all() as Lang[];
  }

  findById(id: string): Lang | undefined {
    return this.db.prepare('SELECT id, name FROM lang WHERE id = ?').get(id) as
      | Lang
      | undefined;
  }

  upsert(lang: Lang): void {
    this.db
      .prepare(
        'INSERT INTO lang (id, name) VALUES ($id, $name) ON CONFLICT(id) DO UPDATE SET name = excluded.name',
      )
      .run({ id: lang.id, name: lang.name });
  }
}
