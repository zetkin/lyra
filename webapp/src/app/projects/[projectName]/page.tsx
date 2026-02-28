import { NextPage } from 'next';

import ProjectDashboard from '@/components/ProjectDashboard';

const ProjectPage: NextPage<{
  params: { projectName: string };
}> = async ({ params }) => {
  return <ProjectDashboard projectName={params.projectName} />;
};

export default ProjectPage;
