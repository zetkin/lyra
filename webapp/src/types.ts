import { Store } from '@/store/Store';

export type LanguageMap = Map<string, Record<string, string>>;

declare global {
  // eslint-disable-next-line
  var store: Store;
}

export type ProjectItem = {
  /**
   * The URL of the project page.
   */
  href: string;

  /**
   * The project's languages and their translation progress.
   */
  languages: {
    /**
     * The URL of the page containing the project's messages in this language.
     */

    href: string;

    /**
     * The name of the language.
     */
    language: string;

    /**
     * The percentage of messages translated in this language. 0 means none, 100
     * means all of them.
     */
    progress: number;
  }[];

  /**
   * The number of messages in the project.
   */
  messageCount: number;

  /**
   * The name of the project.
   */
  name: string;
};

export type ProjectsResponse = {
  projects: ProjectItem[];
};
