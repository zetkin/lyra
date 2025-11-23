import * as sedk from 'sedk-postgres';

const database = new sedk.Database({
  schemas: {
    public: new sedk.Schema({
      name: 'public',
      tables: {
        language: new sedk.Table({
          columns: {
            project: new sedk.NumberColumn({ name: 'project' }),
            value: new sedk.TextColumn({ name: 'value' }),
          },
          name: 'Language',
        }),
        path: new sedk.Table({
          columns: {
            value: new sedk.TextColumn({ name: 'value' }),
          },
          name: 'Path',
        }),
        project: new sedk.Table({
          columns: {
            baseBranch: new sedk.TextColumn({ name: 'base_branch' }),
            host: new sedk.TextColumn({ name: 'host' }),
            name: new sedk.TextColumn({ name: 'name' }),
            projectPath: new sedk.DateColumn({ name: 'project_path' }),
          },
          name: 'Project',
        }),
        sourceFile: new sedk.Table({
          columns: {
            language: new sedk.NumberColumn({ name: 'language' }),
            path: new sedk.NumberColumn({ name: 'path' }),
          },
          name: 'SourceFile',
        }),
        translation: new sedk.Table({
          columns: {
            key: new sedk.NumberColumn({ name: 'key' }),
            state: new sedk.TextColumn({ name: 'state' }),
            text: new sedk.TextColumn({ name: 'text' }),
          },
          name: 'Translation',
        }),
        translationKey: new sedk.Table({
          columns: {
            defaultText: new sedk.TextColumn({ name: 'default_text' }),
            params: new sedk.TextColumn({ name: 'params' }),
            path: new sedk.NumberColumn({ name: 'path' }),
            value: new sedk.TextColumn({ name: 'value' }),
          },
          name: 'TranslationKey',
        })
      },
    }),
  },
  version: 1,
});
