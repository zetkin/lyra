export type LanguageMap = Map<string, Record<string, unknown>>;

declare global {
  var languages: LanguageMap;
}
