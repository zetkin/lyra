import Store from './store/Store';

export type LanguageMap = Map<string, Record<string, string>>;

declare global {
  // eslint-disable-next-line
  var store: Store;
}
