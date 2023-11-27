export type LanguageMap = Map<string, Record<string, unknown>>;

declare global {
  // eslint-disable-next-line no-unused-vars
  var languages: LanguageMap;
}
