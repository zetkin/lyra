import mock from 'mock-fs';
import { ServerConfig } from './ServerConfig';
import { describe, expect, it } from '@jest/globals';
import { ProjectNameNotFoundError, ServerConfigReadingError } from '@/errors';

describe('ServerConfig', () => {
  describe('get()', () => {
    it('reads project property from server config projects', async () => {
      mock({
        '../config/projects.yaml': [
          'projects:',
          '  - name: foo',
          '    local_path: /path/to/repo',
          '    sub_project_path: ./subproject',
          '    host: github.com',
          '    owner: owner',
          '    repo: app.zetkin.org',
          '    github_token: github_123245',
        ].join('\n'),
      });
      const config = await ServerConfig.get(false);
      const projectConfigArr = Array.from(config.projects.values());

      expect(projectConfigArr[0].name).toEqual('foo');
      expect(projectConfigArr[0].localPath).toEqual('/path/to/repo');
      expect(projectConfigArr[0].subProjectPath).toEqual('./subproject');
      expect(projectConfigArr[0].host).toEqual('github.com');
      expect(projectConfigArr[0].owner).toEqual('owner');
      expect(projectConfigArr[0].repo).toEqual('app.zetkin.org');
      expect(projectConfigArr[0].githubToken).toEqual('github_123245');
    });
    it('reads multi project', async () => {
      mock({
        '../config/projects.yaml': [
          'projects:',
          '  - name: foo',
          '    local_path: /path/to/repo',
          '    sub_project_path: ./subproject1',
          '    host: github.com',
          '    owner: owner',
          '    repo: app.zetkin.org',
          '    github_token: github_123245',
          '  - name: bar',
          '    local_path: /path/to/repo',
          '    sub_project_path: ./subproject2',
          '    host: github.com',
          '    owner: owner',
          '    repo: app.zetkin.org',
          '    github_token: github_123245',
        ].join('\n'),
      });
      const config = await ServerConfig.get(false);
      const projectConfigArr = Array.from(config.projects.values());

      expect(projectConfigArr.length).toEqual(2);
      expect(projectConfigArr[0].name).toEqual('foo');
      expect(projectConfigArr[0].subProjectPath).toEqual('./subproject1');
      expect(projectConfigArr[1].name).toEqual('bar');
      expect(projectConfigArr[1].subProjectPath).toEqual('./subproject2');
    });
    it('throws for empty projects file', async () => {
      expect.assertions(1);
      mock({
        '../config/projects.yaml': '',
      });
      const actual = () => ServerConfig.get(false);
      await expect(actual).rejects.toThrow();
    });
    it('throws for missing projects file', async () => {
      expect.assertions(1);
      mock({
        './config/WrongFile.yaml': [
          'projects:',
          '  - name: foo',
          '    local_path: /path/to/repo',
          '    sub_project_path: ./subproject',
          '    host: github.com',
          '    owner: owner',
          '    repo: app.zetkin.org',
          '    github_token: github_123245',
        ].join('\n'),
      });
      const actual = () => ServerConfig.get(false);
      await expect(actual).rejects.toThrow(ServerConfigReadingError);
    });
  });
  describe('getProjectConfigByName()', () => {
    it('reads config of project by name', async () => {
      mock({
        '../config/projects.yaml': [
          'projects:',
          '  - name: foo',
          '    local_path: /path/to/repo',
          '    sub_project_path: ./subproject1',
          '    host: github.com',
          '    owner: owner',
          '    repo: app.zetkin.org',
          '    github_token: github_123245',
          '  - name: bar',
          '    local_path: /path/to/repo',
          '    sub_project_path: ./subproject2',
          '    host: github.com',
          '    owner: owner',
          '    repo: app.zetkin.org',
          '    github_token: github_123245',
        ].join('\n'),
      });
      const projectConfig = await ServerConfig.getProjectConfig('bar');
      expect(projectConfig.localPath).toEqual('/path/to/repo');
      expect(projectConfig.subProjectPath).toEqual('./subproject2');
    });

    it('throw ProjectNameNotFoundError for invalid project path', async () => {
      expect.assertions(1);
      mock({
        '../config/projects.yaml': [
          'projects:',
          '  - name: foo',
          '    local_path: /path/to/repo',
          '    sub_project_path: ./subproject1',
          '    host: github.com',
          '    owner: owner',
          '    repo: app.zetkin.org',
          '    github_token: github_123245',
        ].join('\n'),
      });
      const config = await ServerConfig.get();
      const actual = () => config.getProjectConfig('wrong_name');
      expect(actual).toThrow(ProjectNameNotFoundError);
    });
  });
});
