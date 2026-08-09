import mock from 'mock-fs';
import { afterEach, describe, expect, it } from '@jest/globals';

import { ServerConfig } from './serverConfig';
import { ProjectNameNotFoundError, ServerConfigReadingError } from '@/errors';
import { paths } from '@/utils/paths';

describe('ServerConfig', () => {
  afterEach(() => {
    mock.restore();
  });

  describe('read()', () => {
    it('reads project property from server config projects', async () => {
      mock({
        '../config/projects.yaml': [
          'projects:',
          '  - name: foo',
          '    base_branch: fooBranch',
          '    project_path: ./project',
          '    owner: owner',
          '    repo: app.zetkin.org',
          '    github_token: github_123245',
          '    host: github.com',
        ].join('\n'),
      });
      const config = await ServerConfig.read();
      expect(config.projects[0].name).toEqual('foo');
      expect(config.projects[0].repoPath).toEqual(
        `${paths.lyraProjectsAbsPath}/app.zetkin.org`,
      );
      expect(config.projects[0].baseBranch).toEqual('fooBranch');
      expect(config.projects[0].originBaseBranch).toEqual('origin/fooBranch');
      expect(config.projects[0].projectPath).toEqual('project'); // Note: path changed after normalization
      expect(config.projects[0].owner).toEqual('owner');
      expect(config.projects[0].repo).toEqual('app.zetkin.org');
      expect(config.projects[0].githubToken).toEqual('github_123245');
      expect(config.projects[0].host).toEqual('github.com');
    });

    it('reads multi project', async () => {
      mock({
        '../config/projects.yaml': [
          'projects:',
          '  - name: foo',
          '    project_path: ./project1',
          '    owner: owner',
          '    repo: app.zetkin.org',
          '    host: github.com',
          '    github_token: github_123245',
          '  - name: bar',
          '    project_path: ./project2',
          '    owner: owner',
          '    repo: app.zetkin.org',
          '    host: github.com',
          '    github_token: github_123245',
        ].join('\n'),
      });
      const config = await ServerConfig.read();
      expect(config.projects.length).toEqual(2);
      expect(config.projects[0].name).toEqual('foo');
      expect(config.projects[0].projectPath).toEqual('project1');
      expect(config.projects[1].name).toEqual('bar');
      expect(config.projects[1].projectPath).toEqual('project2');
    });

    it('return empty array for empty projects file', async () => {
      mock({
        '../config/projects.yaml': '',
      });
      const actual = await ServerConfig.read();
      expect(actual.projects).toEqual([]);
    });

    it('throws for missing projects file', async () => {
      expect.assertions(1);
      mock({
        './config/WrongFile.yaml': [
          'projects:',
          '  - name: foo',
          '    project_path: ./project',
          '    owner: owner',
          '    repo: app.zetkin.org',
          '    host: github.com',
          '    github_token: github_123245',
        ].join('\n'),
      });
      const actual = ServerConfig.read();
      await expect(actual).rejects.toThrow(ServerConfigReadingError);
    });
  });

  describe('getProjectConfigByName()', () => {
    it('reads config of project by name', async () => {
      mock({
        '../config/projects.yaml': [
          'projects:',
          '  - name: foo',
          '    project_path: ./project1',
          '    owner: owner',
          '    repo: app.zetkin.org',
          '    host: github.com',
          '    github_token: github_123245',
          '  - name: bar',
          '    project_path: ./project2',
          '    owner: owner',
          '    repo: app.zetkin.org',
          '    host: github.com',
          '    github_token: github_123245',
        ].join('\n'),
      });
      const projectConfig = await ServerConfig.getProjectConfig('bar');
      expect(projectConfig.repoPath).toEqual(
        `${paths.lyraProjectsAbsPath}/app.zetkin.org`,
      );
      expect(projectConfig.baseBranch).toEqual('main'); // Note: default value when missed in config
      expect(projectConfig.originBaseBranch).toEqual('origin/main'); // Note: default value when missed in config
      expect(projectConfig.projectPath).toEqual('project2');
    });

    it('throws ProjectNameNotFoundError for invalid project path', async () => {
      mock({
        '../config/projects.yaml': [
          'projects:',
          '  - name: foo',
          '    project_path: ./project1',
          '    owner: owner',
          '    repo: app.zetkin.org',
          '    host: github.com',
          '    github_token: github_123245',
        ].join('\n'),
      });
      const config = await ServerConfig.read();
      const actual = () => config.getProjectConfig('wrong_name');
      expect(actual).toThrow(ProjectNameNotFoundError);
    });
  });
});
