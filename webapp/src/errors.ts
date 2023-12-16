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
