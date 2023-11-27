export class LanguageNotFound extends Error {
    constructor(lang: string) {
        super(`Language ${lang} not found`);
    }
}
