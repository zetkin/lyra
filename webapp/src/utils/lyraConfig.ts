import fs from 'fs/promises';
import { parse } from 'yaml';
import path from 'path';
import { z } from 'zod';

import { LyraConfigReadingError, ProjectPathNotFoundError } from '@/errors';

export enum MessageKind {
  TS = 'ts',
  YAML = 'yaml',
}

const KIND_BY_FORMAT_VALUE: Record<'ts' | 'yaml', MessageKind> = {
  ts: MessageKind.TS,
  yaml: MessageKind.YAML,
};

const lyraConfigSchema = z.object({
  /** @deprecated baseBranch has been moved to serverConfigSchema as base_branch */
  baseBranch: z.undefined(),
  projects: z.array(
    z.object({
      languages: z.optional(z.array(z.string()).min(1)),
      messages: z.object({
        format: z.enum(['ts', 'yaml']),
        path: z.string(),
      }),
      path: z.string(),
      translations: z.object({
        path: z.string(),
      }),
    }),
  ),
});

async function getLyraConfigPath(repoPath: string): Promise<string> {
  const yamlFilepath = path.join(repoPath, 'lyra.yaml');
  const ymlFilepath = path.join(repoPath, 'lyra.yml');
  try {
    await fs.access(yamlFilepath);
    return yamlFilepath;
  } catch {
    try {
      await fs.access(ymlFilepath);
      return ymlFilepath;
    } catch (e) {
      throw new LyraConfigReadingError('lyra.yml or lyra.yaml', e);
    }
  }
}

export class LyraConfig {
  private constructor(public readonly projects: LyraProjectConfig[]) {}

  public getProjectConfigByPath(projectPath: string): LyraProjectConfig {
    const projectConfig = this.projects.find(
      (project) => project.relativePath === projectPath,
    );
    if (projectConfig) {
      return projectConfig;
    }
    throw new ProjectPathNotFoundError(projectPath);
  }

  static async readFromDir(repoPath: string): Promise<LyraConfig> {
    // TODO: cache this call with TTL
    const lyraConfigPath = await getLyraConfigPath(repoPath);

    try {
      const ymlBuf = await fs.readFile(lyraConfigPath);
      const configData = parse(ymlBuf.toString());

      const parsed = lyraConfigSchema.parse(configData);

      return new LyraConfig(
        parsed.projects.map((project) => {
          LyraConfig.valdidateLanguages(project.languages);
          return new LyraProjectConfig({
            languages: project.languages ?? ['en'], // default language to be english if not provided
            messageKind: KIND_BY_FORMAT_VALUE[project.messages.format],
            messagesPath: project.messages.path,
            path: project.path,
            repoPath: repoPath,
            translationsPath: project.translations.path,
          });
        }),
      );
    } catch (e) {
      throw new LyraConfigReadingError(lyraConfigPath, e);
    }
  }

  private static valdidateLanguages(languages?: string[]) {
    if (languages === undefined) {
      return;
    }
    for (const [index, language] of languages.entries()) {
      if (/^[a-z]{2}$/.test(language)) {
        continue;
      }

      throw new SyntaxError(`invalid language at index ${index}`);
    }
  }
}

export type LyraProjectConfigProps = {
  languages: string[];
  messageKind: string;
  messagesPath: string;
  path: string;
  repoPath: string;
  translationsPath: string;
};

export class LyraProjectConfig {
  private readonly repoPath: string;
  private readonly path: string;
  public readonly messageKind: string;
  public readonly messagesPath: string;
  private readonly translationsPath: string;
  public readonly languages: string[];

  constructor({
    repoPath,
    path,
    messageKind,
    messagesPath,
    translationsPath,
    languages,
  }: LyraProjectConfigProps) {
    this.repoPath = repoPath;
    this.path = path;
    this.messageKind = messageKind;
    this.messagesPath = messagesPath;
    this.translationsPath = translationsPath;
    /*
     * Lyra was written primarily for Zetkin Generation 3
     * which uses react-intl from FormatJS to format messages.
     *
     * FormatJS documents that it uses "locale code" defined in UTS LDML.
     *
     * https://formatjs.io/docs/core-concepts/basic-internationalization-principles
     *
     * Unicode Technical Standard Locale Data Markup Language
     * does not define any locale code
     * but they do define locale identifiers.
     *
     * Lower case language subtags are valid locale identifiers
     * and will likely suffice for a long time.
     *
     * https://www.unicode.org/reports/tr35/tr35.html
     *
     * Unicode language subtags are based on BCP 47
     * and BCP 47 includes at least many language codes from ISO 639-1
     * but note that BCP 47 does not commit to including
     * all languages codes of ISO 639-1.
     *
     * https://www.rfc-editor.org/rfc/rfc5646.html
     *
     * Some valid examples are:
     * - da
     * - de
     * - en
     * - nn
     * - sv
     *
     * However, english is usually the language of default messages
     * and Lyra has no support for translating default messages.
     */
    this.languages = languages;
  }

  get absPath(): string {
    return path.join(this.repoPath, this.path);
  }

  get relativePath(): string {
    return path.normalize(this.path);
  }

  get absMessagesPath(): string {
    return path.join(this.repoPath, this.path, this.messagesPath);
  }

  get absTranslationsPath(): string {
    return path.join(this.repoPath, this.path, this.translationsPath);
  }

  isLanguageSupported(lang: string): boolean {
    return this.languages.includes(lang);
  }
}
