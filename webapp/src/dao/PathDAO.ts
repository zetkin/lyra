import { BaseDAO } from './db';
import { Path } from './types';

export class PathDAO extends BaseDAO {
  findByProject(projectId: number): Path[] {
    return this.db
      .prepare('SELECT id, project, value FROM path WHERE project = ?')
      .all(projectId) as Path[];
  }

  findOrCreate(projectId: number, value: string): Path {
    const existing = this.db
      .prepare('SELECT id, project, value FROM path WHERE project = ? AND value = ?')
      .get(projectId, value) as Path | undefined;
    if (existing) {
      return existing;
    }
    const result = this.db
      .prepare('INSERT INTO path (project, value) VALUES (?, ?)')
      .run(projectId, value);
    return this.db
      .prepare('SELECT id, project, value FROM path WHERE id = ?')
      .get(Number(result.lastInsertRowid)) as Path;
  }
}