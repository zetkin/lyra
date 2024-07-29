import { NextPage } from 'next';
import { notFound } from 'next/navigation';

import { accessProject } from '@/dataAccess';
import { Promises } from '@/utils/Promises';
import ProjectDashboard from '@/components/ProjectDashboard';

const ProjectPage: NextPage<{
  params: { projectName: string };
}> = async ({ params }) => {
  const projectNameParam = params.projectName;

  const project = await accessProject(projectNameParam);
  if (!project) {
    return notFound();
  }
  const { projectName, messages, languagesWithTranslations } = project;
  const languages = await new Promises(languagesWithTranslations)
    .map(({ lang, translations }) => {
      return {
        href: `/projects/${projectName}/${lang}`,
        language: lang,
        messagesLeft: messages.length - Object.keys(translations).length,
        progress: translations
          ? (Object.keys(translations).length / messages.length) * 100
          : 0,
      };
    })
    .all();

  return (
    <ProjectDashboard
      languages={languages}
      messageCount={messages.length}
      project={projectName}
    />
  );
};

export default ProjectPage;
