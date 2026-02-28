import { BaseDAO } from './db';
import { Lang } from './types';

export class ProjectLangDAO extends BaseDAO {
  findLangsByProject(projectId: number): Lang[] {
    return this.db
      .prepare(
        'SELECT l.id, l.name FROM lang l JOIN project_lang pl ON pl.lang = l.id WHERE pl.project = ?',
      )
      .all(projectId) as Lang[];
  }

  add(projectId: number, langId: string): void {
    this.db
      .prepare(
        'INSERT OR IGNORE INTO project_lang (project, lang) VALUES (?, ?)',
      )
      .run(projectId, langId);
  }

  remove(projectId: number, langId: string): void {
    this.db
      .prepare('DELETE FROM project_lang WHERE project = ? AND lang = ?')
      .run(projectId, langId);
  }
}
