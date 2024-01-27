export class LanguageNotFound extends Error {
  constructor(lang: string) {
    super(`Language ${lang} not found`);
  }
}

export class MessageNotFound extends Error {
  constructor(lang: string, msgId: string) {
    super(`Message ${msgId} for language ${lang} not found`);
  }
}

export class LyraConfigReadingError extends Error {
  constructor(filename: string) {
    super(`Error reading file: [${filename}]`);
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
  constructor(public langFilename: string, public error: unknown) {
    super(`Error writing language file: [${langFilename}]`);
  }
}

export class WriteLanguageFileErrors extends Error {
  constructor(public errors: WriteLanguageFileError[]) {
    super(`Error writing language file(s): [${errors.map((e) => e.langFilename).join(', ')}]`);
  }
}
