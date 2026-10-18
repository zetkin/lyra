import { LanguageWithProgress, ProjectDto } from '@/dto/ProjectDto';
import { ProjectsDAO } from '@/dao/ProjectsDAO';
import { TranslationDAO } from '@/dao/TranslationDAO';
import { ProjectLangDAO } from '@/dao/ProjectLangDAO';
import { I18nDAO } from '@/dao/I18nDAO';

export class ProjectService {
  public getProjects(): ProjectDto[] {
    const projects = ProjectsDAO.findAll();
    const projectDtos: ProjectDto[] = [];
    for (const project of projects) {
      const langs = ProjectLangDAO.findLangsByProject(project.id);
      const languages: LanguageWithProgress[] = [];
      const messageCount = I18nDAO.countByProject(project.id);
      for (const lang of langs) {
        const transCount = TranslationDAO.countTranslationForProjectForLanguage(
          project.id,
          lang.id,
        );
        languages.push({
          language: lang.name,
          progress: transCount / messageCount,
        });
      }

      const name = project.name;
      const projectDto: ProjectDto = { languages, messageCount, name };
      projectDtos.push(projectDto);
    }

    return projectDtos;
  }
}
