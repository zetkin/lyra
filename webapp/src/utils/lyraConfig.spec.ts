import mock from 'mock-fs';
import { afterEach, describe, expect, it } from '@jest/globals';
import { LyraConfig, MessageKind } from './lyraConfig';
import { LyraConfigReadingError, ProjectPathNotFoundError } from '@/errors';

describe('LyraConfig', () => {
  afterEach(() => {
    mock.restore();
  });

  describe('readFromDir()', () => {
    it('reads message kind and path from lyra.yml', async () => {
      mock({
        '/path/to/repo/lyra.yml': [
          'projects:',
          '- path: .',
          '  messages:',
          '    format: yaml',
          '    path: locale',
          '  translations:',
          '    path: locale',
        ].join('\n'),
      });
      const config = await LyraConfig.readFromDir('/path/to/repo');
      expect(config.projects[0].messageKind).toEqual(MessageKind.YAML);
      expect(config.projects[0].absMessagesPath).toEqual(
        '/path/to/repo/locale',
      );
      expect(config.projects[0].absTranslationsPath).toEqual(
        '/path/to/repo/locale',
      );
      expect(config.projects[0].languages).toEqual(['en']); // default value
    });

    it('combines project path with messages path', async () => {
      mock({
        '/path/to/repo/lyra.yml': [
          'projects:',
          '- path: project',
          '  messages:',
          '    format: yaml',
          '    path: locale',
          '  translations:',
          '    path: locale',
        ].join('\n'),
      });

      const config = await LyraConfig.readFromDir('/path/to/repo');
      expect(config.projects[0].absMessagesPath).toEqual(
        '/path/to/repo/project/locale',
      );
      expect(config.projects[0].absTranslationsPath).toEqual(
        '/path/to/repo/project/locale',
      );
    });

    it('reads more than one projects', async () => {
      mock({
        '/path/to/repo/lyra.yml': [
          'projects:',
          '- path: project1',
          '  messages:',
          '    format: yaml',
          '    path: locale1',
          '  translations:',
          '    path: locale1',
          '- path: project2',
          '  messages:',
          '    format: ts',
          '    path: msg_locale2',
          '  translations:',
          '    path: trans_locale2',
        ].join('\n'),
      });

      const config = await LyraConfig.readFromDir('/path/to/repo');
      expect(config.projects.length).toEqual(2);

      expect(config.projects[0].relativePath).toEqual('project1');
      expect(config.projects[0].absPath).toEqual('/path/to/repo/project1');
      expect(config.projects[0].absMessagesPath).toEqual(
        '/path/to/repo/project1/locale1',
      );
      expect(config.projects[0].absTranslationsPath).toEqual(
        '/path/to/repo/project1/locale1',
      );
      expect(config.projects[0].messageKind).toEqual(MessageKind.YAML);

      expect(config.projects[1].relativePath).toEqual('project2');
      expect(config.projects[1].absPath).toEqual('/path/to/repo/project2');
      expect(config.projects[1].absMessagesPath).toEqual(
        '/path/to/repo/project2/msg_locale2',
      );
      expect(config.projects[1].absTranslationsPath).toEqual(
        '/path/to/repo/project2/trans_locale2',
      );
      expect(config.projects[1].messageKind).toEqual(MessageKind.TS);
    });

    describe('LyraConfigReadingError', () => {
      it('throws for empty file', async () => {
        expect.assertions(1);
        mock({ '/path/to/repo/lyra.yml': '' });

        const actual = LyraConfig.readFromDir('/path/to/repo');
        await expect(actual).rejects.toThrow(LyraConfigReadingError);
      });

      it('throws for missing messages path', async () => {
        expect.assertions(1);
        mock({
          '/path/to/repo/lyra.yml': [
            'projects:',
            '- path: project',
            '  messages:',
            '    format: ts',
            '  translations:',
            '    path: anyValue',
          ].join('\n'),
        });
        const actual = LyraConfig.readFromDir('/path/to/repo');
        await expect(actual).rejects.toThrow(LyraConfigReadingError);
      });

      it('throws for define deprecated property baseBranch', async () => {
        expect.assertions(1);
        mock({
          '/path/to/repo/lyra.yml': [
            'baseBranch: anyValue', // deprecated
            'projects:',
            '- path: project',
            '  messages:',
            '    format: ts',
            '    path: anyValue',
            '  translations:',
            '    path: anyValue',
          ].join('\n'),
        });
        const actual = LyraConfig.readFromDir('/path/to/repo');
        await expect(actual).rejects.toThrow(LyraConfigReadingError);
      });

      it('throws for file not found', async () => {
        expect.assertions(1);
        mock({
          '/path/to/repo/xxx.yml': [
            'projects:',
            '- path: project',
            '  messages:',
            '    format: ts',
            '    path: anyValue',
            '  translations:',
            '    path: anyValue',
          ].join('\n'),
        });
        const actual = LyraConfig.readFromDir('/path/to/repo');
        await expect(actual).rejects.toThrow(LyraConfigReadingError);
      });
    });
  });

  describe('getProjectConfigByPath()', () => {
    it('reads config from lyra.yml of single project repo', async () => {
      mock({
        '/path/to/repo/lyra.yml': [
          'projects:',
          '- path: .',
          '  messages:',
          '    format: yaml',
          '    path: locale',
          '  translations:',
          '    path: locale',
        ].join('\n'),
      });
      const config = await LyraConfig.readFromDir('/path/to/repo');
      const projectConfig = config.getProjectConfigByPath('.');
      expect(projectConfig.messageKind).toEqual(MessageKind.YAML);
      expect(projectConfig.absMessagesPath).toEqual('/path/to/repo/locale');
      expect(projectConfig.absTranslationsPath).toEqual('/path/to/repo/locale');
      expect(projectConfig.languages).toEqual(['en']); // default value
    });
    it('reads message kind and path from lyra.yml', async () => {
      mock({
        '/path/to/repo/lyra.yml': [
          'projects:',
          '- path: foo',
          '  messages:',
          '    format: yaml',
          '    path: locale',
          '  translations:',
          '    path: locale',
        ].join('\n'),
      });
      const config = await LyraConfig.readFromDir('/path/to/repo');
      const projectConfig = config.getProjectConfigByPath('foo');
      expect(projectConfig.messageKind).toEqual(MessageKind.YAML);
      expect(projectConfig.absMessagesPath).toEqual('/path/to/repo/foo/locale');
      expect(projectConfig.absTranslationsPath).toEqual(
        '/path/to/repo/foo/locale',
      );
    });

    it('reads message kind and path from lyra.yml with multi projects', async () => {
      mock({
        '/path/to/repo/lyra.yml': [
          'projects:',
          '- path: foo1',
          '  messages:',
          '    format: yaml',
          '    path: locale1',
          '  translations:',
          '    path: locale1',
          '- path: foo2',
          '  messages:',
          '    format: ts',
          '    path: src',
          '  translations:',
          '    path: locale2',
        ].join('\n'),
      });
      const config = await LyraConfig.readFromDir('/path/to/repo');
      const projectConfig1 = config.getProjectConfigByPath('foo1');
      const projectConfig2 = config.getProjectConfigByPath('foo2');

      expect(projectConfig1.messageKind).toEqual(MessageKind.YAML);
      expect(projectConfig1.absMessagesPath).toEqual(
        '/path/to/repo/foo1/locale1',
      );
      expect(projectConfig1.absTranslationsPath).toEqual(
        '/path/to/repo/foo1/locale1',
      );
      expect(projectConfig2.messageKind).toEqual(MessageKind.TS);
      expect(projectConfig2.absMessagesPath).toEqual('/path/to/repo/foo2/src');
      expect(projectConfig2.absTranslationsPath).toEqual(
        '/path/to/repo/foo2/locale2',
      );
    });

    it('reads languages from lyra.yml with multi projects', async () => {
      mock({
        '/path/to/repo/lyra.yml': [
          'projects:',
          '- path: foo1',
          '  languages: [en, fr]',
          '  messages:',
          '    format: yaml',
          '    path: locale1',
          '  translations:',
          '    path: locale1',
          '- path: foo2',
          '  languages: [en, sv]',
          '  messages:',
          '    format: ts',
          '    path: src',
          '  translations:',
          '    path: locale2',
        ].join('\n'),
      });
      const config = await LyraConfig.readFromDir('/path/to/repo');
      const projectConfig1 = config.getProjectConfigByPath('foo1');
      const projectConfig2 = config.getProjectConfigByPath('foo2');

      expect(projectConfig1.languages).toEqual(['en', 'fr']);
      expect(projectConfig1.isLanguageSupported('en')).toBeTruthy();
      expect(projectConfig1.isLanguageSupported('fr')).toBeTruthy();
      expect(projectConfig1.isLanguageSupported('sv')).toBeFalsy();
      expect(projectConfig2.languages).toEqual(['en', 'sv']);
      expect(projectConfig2.isLanguageSupported('en')).toBeTruthy();
      expect(projectConfig2.isLanguageSupported('sv')).toBeTruthy();
      expect(projectConfig2.isLanguageSupported('fr')).toBeFalsy();
    });

    describe('ProjectPathNotFoundError', () => {
      it('throws for for invalid project path', async () => {
        mock({
          '/path/to/repo/lyra.yml': [
            'projects:',
            '- path: project',
            '  messages:',
            '    format: yaml',
            '    path: locale',
            '  translations:',
            '    path: anyValue',
          ].join('\n'),
        });
        const config = await LyraConfig.readFromDir('/path/to/repo');
        const actual = () => config.getProjectConfigByPath('wrongPath');
        expect(actual).toThrow(ProjectPathNotFoundError);
      });
    });
  });
});
