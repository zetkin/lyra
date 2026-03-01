type LanguageWithProgress = {
  /**
   * The name of the language.
   */
  language: string;
  /**
   * The percentage of messages translated in this language. 0 means none, 100
   * means all of them.
   */
  progress: number;
};

export type ProjectDto = {
  /**
   * The project's languages and their translation progress.
   */
  languages: LanguageWithProgress[];
  /**
   * The number of messages in the project.
   */
  messageCount: number;
  /**
   * The name of the project.
   */
  name: string;
};
