import { LanguageWithProgress, ProjectDto } from '@/dto/ProjectDto';
import { ProjectsDAO } from '@/dao/ProjectsDAO';
import { TranslationDAO } from '@/dao/TranslationDAO';
import { ProjectLangDAO } from '@/dao/ProjectLangDAO';

export class ProjectService {
  public getProjects(): ProjectDto[] {
    const projects = ProjectsDAO.findAll();
    const projectDtos: ProjectDto[] = [];
    for (const project of projects) {
      const langs = ProjectLangDAO.findLangsByProject(project.id); // TODO: collect the languages of a project
      const languages: LanguageWithProgress[] = [];
      for (const lang of langs) {
        const transCount = TranslationDAO.countTranslationForProjectForLanguage(
          project.id,
          lang.id,
        );
        languages.push({
          language: lang.name,
          progress: transCount / messageCount, //TODO: messageCount
        });
      }

      const name = project.name;
      projectDtos.push({ languages, messageCount, name });
    }

    return projectDtos;
  }
}
