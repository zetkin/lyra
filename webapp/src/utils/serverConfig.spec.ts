import mock from 'mock-fs';
import { ServerConfig } from './serverConfig';
import { describe, expect, it } from '@jest/globals';
import { ProjectNameNotFoundError, ServerConfigReadingError } from '@/errors';

describe('ServerConfig', () => {
  describe('read()', () => {
    it('reads project property from server config projects', async () => {
      mock({
        '../config/projects.yaml': [
          'projects:',
          '  - name: foo',
          '    repo_path: /path/to/repo',
          '    project_path: ./project',
          '    host: github.com',
          '    owner: owner',
          '    repo: app.zetkin.org',
          '    github_token: github_123245',
        ].join('\n'),
      });
      const config = await ServerConfig.read();
      expect(config.projects[0].name).toEqual('foo');
      expect(config.projects[0].repoPath).toEqual('/path/to/repo');
      expect(config.projects[0].projectPath).toEqual('./project');
      expect(config.projects[0].host).toEqual('github.com');
      expect(config.projects[0].owner).toEqual('owner');
      expect(config.projects[0].repo).toEqual('app.zetkin.org');
      expect(config.projects[0].githubToken).toEqual('github_123245');
    });
    it('reads multi project', async () => {
      mock({
        '../config/projects.yaml': [
          'projects:',
          '  - name: foo',
          '    repo_path: /path/to/repo',
          '    project_path: ./project1',
          '    host: github.com',
          '    owner: owner',
          '    repo: app.zetkin.org',
          '    github_token: github_123245',
          '  - name: bar',
          '    repo_path: /path/to/repo',
          '    project_path: ./project2',
          '    host: github.com',
          '    owner: owner',
          '    repo: app.zetkin.org',
          '    github_token: github_123245',
        ].join('\n'),
      });
      const config = await ServerConfig.read();
      expect(config.projects.length).toEqual(2);
      expect(config.projects[0].name).toEqual('foo');
      expect(config.projects[0].projectPath).toEqual('./project1');
      expect(config.projects[1].name).toEqual('bar');
      expect(config.projects[1].projectPath).toEqual('./project2');
    });
    it('throws for empty projects file', async () => {
      expect.assertions(1);
      mock({
        '../config/projects.yaml': '',
      });
      const actual = () => ServerConfig.read();
      await expect(actual).rejects.toThrow();
    });
    it('throws for missing projects file', async () => {
      expect.assertions(1);
      mock({
        './config/WrongFile.yaml': [
          'projects:',
          '  - name: foo',
          '    repo_path: /path/to/repo',
          '    project_path: ./project',
          '    host: github.com',
          '    owner: owner',
          '    repo: app.zetkin.org',
          '    github_token: github_123245',
        ].join('\n'),
      });
      const actual = () => ServerConfig.read();
      await expect(actual).rejects.toThrow(ServerConfigReadingError);
    });
  });
  describe('getProjectConfigByName()', () => {
    it('reads config of project by name', async () => {
      mock({
        '../config/projects.yaml': [
          'projects:',
          '  - name: foo',
          '    repo_path: /path/to/repo',
          '    project_path: ./project1',
          '    host: github.com',
          '    owner: owner',
          '    repo: app.zetkin.org',
          '    github_token: github_123245',
          '  - name: bar',
          '    repo_path: /path/to/repo',
          '    project_path: ./project2',
          '    host: github.com',
          '    owner: owner',
          '    repo: app.zetkin.org',
          '    github_token: github_123245',
        ].join('\n'),
      });
      const projectConfig = await ServerConfig.getProjectConfig('bar');
      expect(projectConfig.repoPath).toEqual('/path/to/repo');
      expect(projectConfig.projectPath).toEqual('./project2');
    });

    it('throw ProjectNameNotFoundError for invalid project path', async () => {
      expect.assertions(1);
      mock({
        '../config/projects.yaml': [
          'projects:',
          '  - name: foo',
          '    repo_path: /path/to/repo',
          '    project_path: ./project1',
          '    host: github.com',
          '    owner: owner',
          '    repo: app.zetkin.org',
          '    github_token: github_123245',
        ].join('\n'),
      });
      const config = await ServerConfig.read();
      const actual = () => config.getProjectConfig('wrong_name');
      expect(actual).toThrow(ProjectNameNotFoundError);
    });
  });
});
