import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const DB_PATH = './db/lyra.db';

let _db: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (!_db) {
    _db = new DatabaseSync(DB_PATH);
    const schema = readFileSync(join(process.cwd(), 'db/tables.sql'), 'utf-8');
    _db.exec(schema);
  }
  return _db;
}

export abstract class BaseDAO {
  static readonly db: DatabaseSync = getDb();
}
