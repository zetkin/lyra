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
    const filename = path.join(repoPath, 'lyra.yml');
    try {
      const ymlBuf = await fs.readFile(filename);
      const configData = parse(ymlBuf.toString());

      const parsed = lyraConfigSchema.parse(configData);

      return new LyraConfig(
        parsed.projects.map((project) => {
          LyraConfig.validateLanguages(project.languages);
          return new LyraProjectConfig(
            repoPath,
            project.path,
            KIND_BY_FORMAT_VALUE[project.messages.format],
            project.messages.path,
            project.translations.path,
            project.languages ?? ['en'], // default language to be english if not provided
          );
        }),
      );
    } catch (e) {
      throw new LyraConfigReadingError(filename, e);
    }
  }

  private static validateLanguages(languages?: string[]) {
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

export class LyraProjectConfig {
  constructor(
    private readonly repoPath: string,
    private readonly path: string,
    public readonly messageKind: string,
    private readonly messagesPath: string,
    private readonly translationsPath: string,

    /*
     * Lyra was written primarily for Zetkin Generation 3
     * which uses react-intl from FromatJS to format messages.
     *
     * FormatJS documents that it uses "locale code" defined in UTS LDML.
     *
     * https://formatjs.io/docs/core-concepts/basic-internationalization-principles
     *
     * Unicode Technical Standard Locale Data Marmkup Language
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
    public readonly languages: string[],
  ) {}

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
