import { NextPage } from 'next';

import ProjectDashboard from '@/components/ProjectDashboard';

const ProjectPage: NextPage<{
  params: { projectId: string; repositoryName: string };
}> = async ({ params }) => (
  <ProjectDashboard
    projectId={parseInt(params.projectId)}
    repositoryName={params.repositoryName}
  />
);

export default ProjectPage;
