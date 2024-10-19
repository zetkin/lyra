import { Store } from '@/store/Store';

export type LanguageMap = Map<string, Record<string, string>>;

declare global {
  /**
   * Either we promised to complete initialization,
   * or we are ready to initialize.
   *
   * Every concurrent task can await the same initialization.
   */
  // eslint-disable-next-line
  var store: Promise<Store> | null;
}
