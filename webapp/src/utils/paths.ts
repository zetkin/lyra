import path from 'path';

const projectsYamlRelPath = 'config/projects.yaml';
const projectsYmlRelPath = 'config/projects.yml';
const lyraProjectsFolder = 'lyra-projects';
const webappAbsPath = process.cwd();
const lyraAbsPath = path.resolve(webappAbsPath, '..');
const projectsYamlAbsPath = path.resolve(lyraAbsPath, projectsYamlRelPath);
const projectsYmlAbsPath = path.resolve(lyraAbsPath, projectsYmlRelPath);
const lyraProjectsAbsPath = path.resolve(lyraAbsPath, '..', lyraProjectsFolder);

export const paths = {
  lyraAbsPath,
  lyraProjectsAbsPath,
  projectsYamlAbsPath,
  projectsYmlAbsPath,
  webappAbsPath,
};
