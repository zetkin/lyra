export class LanguageNotFound extends Error {
  constructor(lang: string) {
    super(`Language ${lang} not found`);
  }
}

export class LanguageNotSupported extends Error {
  constructor(lang: string, projectName: string) {
    super(`Language ${lang} is not supported in project ${projectName}`);
  }
}

export class MessageNotFound extends Error {
  constructor(lang: string, msgId: string) {
    super(`Message ${msgId} for language ${lang} not found`);
  }
}

export class LyraConfigReadingError extends Error {
  constructor(filename: string, error?: unknown) {
    if (error instanceof Error) {
      super(
        `Error reading file: [${filename}], error message:${error.message}`,
      );
    } else {
      super(`Error reading file: [${filename}]`);
    }
  }
}

export class ServerConfigReadingError extends Error {
  constructor(filename: string) {
    super(`Error reading file: [${filename}]`);
  }
}

export class ProjectPathNotFoundError extends Error {
  constructor(projectPath: string) {
    super(`Project with path [${projectPath}] not found`);
  }
}

export class ProjectNameNotFoundError extends Error {
  constructor(projectName: string) {
    super(`Project name: [${projectName}] not found`);
  }
}

export class WriteLanguageFileError extends Error {
  constructor(
    public langFilename: string,
    public error: unknown,
  ) {
    const errorMessage =
      error instanceof Error ? ', error message: ' + error.message : '';

    super(`Error writing language file: [${langFilename}]${errorMessage}`);
  }
}

export class WriteLanguageFileErrors extends Error {
  constructor(public errors: WriteLanguageFileError[]) {
    super(
      `Error writing language file(s): [${errors
        .map((e) => e.langFilename)
        .join(', ')}]`,
    );
  }
}
