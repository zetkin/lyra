import { ProjectDto } from '@/dto/ProjectDto';
import { ProjectsDAO } from '@/dao/ProjectsDAO';

export class ProjectService {
  public getProjects(): ProjectDto[] {
    /*
           progress: translations
            ? (Object.keys(translations).length / messages.length) * 100
            : 0,
    * */
    const projects = ProjectsDAO.findAll();
    const projectDtos: ProjectDto[];
    for (const project of projects) {
      int count
    }
  }
}
