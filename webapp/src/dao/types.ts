export type Project = {
  base_branch: string;
  host: string;
  id: number;
  name: string;
  project_path: string;
};

export type Lang = {
  id: string;
  name: string;
};

export type Path = {
  id: number;
  project: number;
  value: string;
};

export type I18nKey = {
  default_text: string;
  id: number;
  params: string | null;
  path: number;
  value: string;
};

export enum TranslateState {
  PUBLISHED = 'PUBLISHED',
  UPDATED = 'UPDATED',
}

export type Translation = {
  id: number;
  key: number;
  lang: string;
  state: TranslateState;
  text: string;
};