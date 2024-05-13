import ProjectCard from '@/components/ProjectCard';

const stories = {
  component: ProjectCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  title: 'ProjectCard',
};

export const Gen3 = () => (
  <ProjectCard
    href="/projects/gen3"
    languages={[
      { href: '/projects/gen3/Swedish', language: 'Swedish', progress: 75 },
      {
        href: '/projects/gen3/Norwegian',
        language: 'Norwegian',
        progress: 100,
      },
      { href: '/projects/gen3/Danish', language: 'Danish', progress: 50 },
      { href: '/projects/gen3/German', language: 'German', progress: 25 },
    ]}
    messageCount={3289}
    name="Gen3"
  />
);

export default stories;
