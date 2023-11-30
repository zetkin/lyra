export type LanguageMap = Map<string, Record<string, unknown>>;

declare global {
  // eslint-disable-next-line
  var languages: LanguageMap;
}
