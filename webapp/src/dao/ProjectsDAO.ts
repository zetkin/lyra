import { BaseDAO } from './db';
import { Project } from './types';

export class ProjectsDAO extends BaseDAO {
  static findAll(): Project[] {
    return BaseDAO.db
      .prepare('SELECT id, name, base_branch, project_path, host FROM project')
      .all() as Project[];
  }

  static findById(id: number): Project | undefined {
    return BaseDAO.db
      .prepare(
        'SELECT id, name, base_branch, project_path, host FROM project WHERE id = ?',
      )
      .get(id) as Project | undefined;
  }

  static findByName(name: string): Project | undefined {
    return BaseDAO.db
      .prepare(
        'SELECT id, name, base_branch, project_path, host FROM project WHERE name = ?',
      )
      .get(name) as Project | undefined;
  }

  static create(data: Omit<Project, 'id'>): Project {
    const result = BaseDAO.db
      .prepare(
        `INSERT INTO project (name, base_branch, project_path, host)
         VALUES ($name, $base_branch, $project_path, $host)`,
      )
      .run({
        base_branch: data.base_branch,
        host: data.host,
        name: data.name,
        project_path: data.project_path,
      });
    return ProjectsDAO.findById(Number(result.lastInsertRowid))!;
  }
}
