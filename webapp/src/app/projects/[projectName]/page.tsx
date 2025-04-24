import { NextPage } from 'next';
import { notFound } from 'next/navigation';

import { accessProject } from '@/dataAccess';
import { Promises } from '@/utils/Promises';
import ProjectDashboard from '@/components/ProjectDashboard';
import { info, warn } from '@/utils/log';

const ProjectPage: NextPage<{
  params: { projectName: string };
}> = async ({ params }) => {
  const project = await accessProject(params.projectName);
  if (!project) {
    warn(`Project with name '${params.projectName}' not found`);
    return notFound();
  }
  const { name, messages, languagesWithTranslations } = project;
  info(`Accessing project '${name}'`);
  const languages = await Promises.of(languagesWithTranslations)
    .map(({ lang, translations }) => ({
      href: `/projects/${name}/${lang}`,
      language: lang,
      messagesLeft: messages.length - Object.keys(translations).length,
      progress: translations
        ? (Object.keys(translations).length / messages.length) * 100
        : 0,
    }))
    .all();
  info(
    `Found ${languages.length} languages for project '${project.name}': ${languages.map((l) => l.language).join(', ')}`,
  );

  return (
    <ProjectDashboard
      languages={languages}
      messageCount={messages.length}
      project={name}
    />
  );
};

export default ProjectPage;
