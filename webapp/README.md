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

In the root folder (outside webapp) create file `./config/projects.yaml`
with example content:

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

Start the server with `yarn dev` in `webapp`.

Open `http://localhost:3000/projects` to view the configured projects.

For a project `example-unique-name` and a language `yy`,
open `http://localhost:3000/projects/example-unique-name/yy`
to open the translation user interface.

## Dependencies

Lyra runs on Node and likely uses its HTTP-server to serve requests
from Internet. This HTTP server will process data before any
authentication or validation: it is fully exposed. A vulnerability
in Node can have a severe impact of Lyra, including compromise of
GitHub authentication tokens, and through those, compromise of at
least the targeted repositories.

https://nodejs.org/

Under Node, Lyra runs on the framework Next.js, while not as exposed,
or as privileged as Node, it still processes data before authentication
and a lot of that data has not been validated by any other program before
being processed by Next.js. The framework does not have quite as much
privileges as Node but once we are confident in Node being fully patched
and known vulnerabilities being mitigated, we should do the same for Next.js

https://nextjs.org/

We have several other direct dependencies that are used by Lyra but
a vulnerability in any of these will most likely be less severe than
a vulnerability in Node or in Next.

Our direct dependencies pull in more transivite dependencies. Some of
these could be more sensitive than our direct dependencies but we will
likely never have enough resources to analyze them all. With some luck,
the projects producing our direct dependencies takes some responsibility
for their dependencies. Keeping our direct dependencies patched reduces
the risk somewhat of us being affected by public vulnerabilities in our
transitive dependencies.

Lyra's build and test programs have even more dependencies. These will
not typically have access to production data or production credentials,
but they will very likely have access to very powerful developer
credentials. Tracking published vulnerabilities in all these is beyond
all hope and feasibility but we can try to keep them somewhat up to date.
