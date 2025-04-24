import path from 'path';

const projectsYamlRelPath = 'config/projects.yaml';
const projectsYmlRelPath = 'config/projects.yml';
const lyraProjectsFolder = 'lyra-projects';
// Despite our Dockerfile using WORKDIR /app, cwd will be /app/webapp in our container because our next build
// generates a server.js with process.chdir(__dirname).
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
