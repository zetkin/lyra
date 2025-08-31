import { Store } from '@/store/Store';

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
