import ProjectCard from '@/components/ProjectCard';
import { Box } from '@mui/joy';

const stories = {
  component: ProjectCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  title: 'ProjectCard',
};

export const Gen3 = () => (
  <Box width="300px">
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
  </Box>
);

export const Gen2 = () => (
  <Box width="300px">
    <ProjectCard
      href="/projects/gen2"
      languages={[
        { href: '/projects/gen3/en', language: 'en', progress: 0 },
      ]}
      messageCount={99999999999}
      name="Gen2"
    />
  </Box>
);

export const Gen1 = () => (
  <Box width="300px">
    <ProjectCard
      href="/projects/gen1"
      languages={[
        { href: '/projects/gen1/en', language: 'en', progress: 0 },
        { href: '/projects/gen1/fr', language: 'fr', progress: 100 },
        { href: '/projects/gen1/es', language: 'es', progress: 50 },
        { href: '/projects/gen1/pt', language: 'pt', progress: 25 },
        { href: '/projects/gen1/it', language: 'it', progress: 75 },
        { href: '/projects/gen1/de', language: 'de', progress: 99 },
        { href: '/projects/gen1/dk', language: 'dk', progress: 1 },
        { href: '/projects/gen1/sv', language: 'sv', progress: 1000 },
      ]}
      messageCount={99999999999}
      name="Gen1"
    />
  </Box>
);

export default stories;
