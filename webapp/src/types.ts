import { Store } from '@/store/Store';

export type LanguageMap = Map<string, Record<string, string>>;

declare global {
  // eslint-disable-next-line
  var store: Store;
}

export type ProjectItem = {
  name: string;
  owner: string;
  projectPath: string;
  repo: string;
};

export type ProjectsResponse = {
  href: string;
  languages: {
    href: string;
    language: string;
    progress: number;
  }[];
  messageCount: number;
  name: string;
}[];
