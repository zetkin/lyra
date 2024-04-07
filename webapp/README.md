# Lyra web app

## Setup

1. Install yarn
2. Install dependencies: `yarn install`

### Visual Studio Code

If you are using Visual Studio Code, there are a few more optional steps
you can take to setup your develop environment.

#### Prettier

1. Install the extension `Prettier - Code formatter`.
   It has an identifier `esbenp.prettier-vscode`.
2. Configure the extension with the path to our
   configuration file `webapp/.prettierrc.json`.
3. Configure Prettier as the default formatter.

Steps 2 and 3 can be done with a `.vscode/settings.json`:

```
{
    "prettier.configPath": "webapp/.prettierrc.json",
    "editor.defaultFormatter": "esbenp.prettier-vscode"
}
```

#### PlantUML

1. Install the extension `PlantUML` (Id: `jebbs.plantuml`).
2. Follow its documentation for setting up its requirments.

## Running in development

In the root folder create file `./config/projects.yaml` with example content:

```yaml
projects:
  - name: example-unique-name
    repo_path: /Users/username/fooRepo # absolute path to repo
    base_branch: main
    project_path: . # relative path of project from repo_path
    owner: amerharb
    repo: zetkin.app.zetkin.org
    github_token: << github token >>
```

Multiple projects are supported, and multiple projects in the same local git repository
are supported, but configuring multiple porjects with different `repo_path`, resolving to
same local git repository, is _not_ supported.

The project repository (client repository) needs to be cloned locally. and has in the root folder config
file `lyra.yml` with the
example content:

```yaml
projects:
  - path: . # relative path to project in repo
    messages:
      format: ts
      path: src # relative path of messages folder relative from above project path
    translations:
      path: src/locale # relative path of translations folder relative from above project path
    languages: # list of language codes supported in the project
      - sv
      - de
```
