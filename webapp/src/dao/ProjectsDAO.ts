import { BaseDAO } from './db';
import { Project } from './types';

export class ProjectsDAO extends BaseDAO {
  findAll(): Project[] {
    return this.db
      .prepare('SELECT id, name, base_branch, project_path, host FROM project')
      .all() as Project[];
  }

  findById(id: number): Project | undefined {
    return this.db
      .prepare('SELECT id, name, base_branch, project_path, host FROM project WHERE id = ?')
      .get(id) as Project | undefined;
  }

  findByName(name: string): Project | undefined {
    return this.db
      .prepare('SELECT id, name, base_branch, project_path, host FROM project WHERE name = ?')
      .get(name) as Project | undefined;
  }

  create(data: Omit<Project, 'id'>): Project {
    const result = this.db
      .prepare(
        'INSERT INTO project (name, base_branch, project_path, host) VALUES ($name, $base_branch, $project_path, $host)',
      )
      .run({
        $base_branch: data.base_branch,
        $host: data.host,
        $name: data.name,
        $project_path: data.project_path,
      });
    return this.findById(Number(result.lastInsertRowid))!;
  }
}