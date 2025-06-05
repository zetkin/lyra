# Lyra web app

Lyra is a translation management system that integrates with
source code repositories of internationalized applications.

- Lyra can extract messages and translations
  from source code repositories.
- Lyra is an editor for translating messages.
- Lyra can create pull requests to merge updated
  translations into the source code repository.

> [!WARNING]
> A party who controls a source code repository branch
> which Lyra is set up to translate will also have
> a lot of control over the Lyra process. That control
> probably includes reading files from the operating system
> and possibly includes arbitrary code exection.

For each repository Lyra is set up to translate,
Lyra needs control over a file system directory.

> [!WARNING]
> A party who controls the contents of
> a local repository directory will also have
> a lot of control over the Lyra process, probably
> including arbitrary code execution.

## Setup

1. Install npm
2. Install dependencies: `npm install`

### Visual Studio Code

If you are using Visual Studio Code, there are a few more optional steps
you can take to setup your develop environment.

#### Prettier

Install the recommended extension `Prettier - Code formatter`.

#### PlantUML

1. Install the extension `PlantUML` (Id: `jebbs.plantuml`).
2. Follow its documentation for setting up its requirments.

## Running in development

In the root folder (outside webapp) create file `./config/projects.yaml`
with example content:

```yaml
projects:
  - name: example-unique-name
    base_branch: main
    project_path: . # relative path of project from repository root
    owner: amerharb
    repo: zetkin.app.zetkin.org
    host: github.com
    github_token: << github token >>
```

Multiple projects are supported, and they're all stored within the `lyra-projects` folder on the same level as the lyra repository itself.

The project repository (client repository) will be cloned locally (if it does not exist yet) and needs to have a lyra configuration file
`lyra.yml` or `lyra.yaml` in the root of the repository.
This lyra configuration file looks like this:

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
    base_branch: main # optional default to 'main'
```

Start the server with `npm run dev` in `webapp`.

Open the URL provided in the terminal to view projects.

Click on projects to view project pages
or click on languages to view translation pages.

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

## Standalone build (monorepo)

We enable Next.js **standalone output** to keep Docker images tiny.
Because this package lives in a workspace, we must widen dependency tracing.

### `next.config.js`

```js
const path = require('path');

/** @type {import('next').NextConfig} */
module.exports = {
  output: 'standalone',
  experimental: {
    // trace files from the repository root
    outputFileTracingRoot: path.join(__dirname, '../..'),
  },
};
```

### Gotchas

* Place every module that is **imported at runtime** in this package’s `dependencies` (not `devDependencies`).
  Example: `typescript` required by `src/utils/readTypedMessages.ts`.

* After upgrading **Next.js** or adding workspace packages, check the bundle:

  ```bash
  npm run build
  node --check webapp/.next/standalone/lyra/webapp/server.js
  ```

### References

* Next.js docs – “output › Caveats”
  [https://nextjs.org/docs/13/app/api-reference/next-config-js/output#caveats](https://nextjs.org/docs/13/app/api-reference/next-config-js/output#caveats)

* GitHub discussion – deep `webapp/server.js` path (#72436)
  [https://github.com/vercel/next.js/discussions/72436](https://github.com/vercel/next.js/discussions/72436)

* GitHub issue – public assets missing in monorepo builds (#33895)
  [https://github.com/vercel/next.js/issues/33895](https://github.com/vercel/next.js/issues/33895)


## Docker setup

To run Lyra in a docker container, you need to build the Docker image using the [`Dockerfile`](./Dockerfile) in the root of this repository.
The [`docker-compose.yaml`](./docker-compose.yaml) file in the root of this repository can be used to build the image and run the image as a container in one command:
```shell
$ docker compose up
```

or in a detached mode:
```shell
$ docker compose up -d
```

### Docker volume mounts

#### SSH key
Note that in order for the running docker container to be able to interact with the client repository,
you need to mount a private SSH key of a user with access to the repository into the Docker container.
Currently, this is achieved by mounting the private SSH key at `~/.ssh/id_rsa` into the container at
`/home/nodeuser/.ssh/id_rsa`.
If your SSH key is located elsewhere on your local machine, you will need to adjust the path in the
[docker-compose.yaml](./docker-compose.yaml) file accordingly.

When mounting the SSH key into the container, the file ownership and permissions from your local system are preserved. 
Since the container runs as the nodeuser user (UID 1001), but the mounted key is owned by your local user, 
it’s important to ensure that the SSH key has the correct permissions. 
SSH requires that private keys are not accessible by others.
To avoid permission issues, you should set the permissions of your private key to 600 on your local machine:

```bash
$ chmod 600 ~/.ssh/id_rsa
```

This ensures that the private key is only readable by the owner, which is sufficient for SSH to accept it inside the 
container, even if the ownership does not exactly match the container user.

File permissions for the private key and lyra-store.json on your local machine also need to allow access for a user ID of 1001.

**Tip:**
For improved security, consider creating a dedicated SSH key specifically for use with this container, with restricted access to only the necessary repositories.

#### Lyra Store

Before running the container, ensure the file `lyra-store.json` exists on the host system.
This file is the store for lyra projects and is mounted into the container via docker volume mounts. 
You can copy this via `cp store.json  ~/lyra-store.json` to this location or just change it to use the [`store.json`](./store.json) file in the root of the repository.

### Release a new container image

The GitHub Actions workflow [`build-and-push-image.yaml`](.github/workflows/build-and-push-image.yaml) is designed to
automate the process of building, tagging, and pushing a Docker image to the GitHub Container Registry (ghcr.io)
whenever a new tag is pushed to the repository.
The tags must follow semantic versioning, while release candidates are supported as well.

Do not forget to document your changes within the [`CHANGELOG.md`](./webapp/CHANGELOG.md) file and adjusting the version within the [`./webapp/package.json`](./webapp/package.json) file.

### Use built image from the container registry

In case you want to use the already built image that is pushed to the GitHub Container Registry, you can adjust the [
`docker-compose.yaml`](docker-compose.yaml) file as follows (replace `latest` with the version of your preference):

```diff
services:
  lyra:
    container_name: lyra
-   build:
-     context: .
+   image: ghcr.io/zetkin/lyra:latest
    ports:
      - "3000:3000"
    environment:
      - GIT_USER_EMAIL=lyra@zetk.in
      - GIT_USER_NAME="Lyra Translator Bot"
    volumes:
      - ~/.ssh/id_github:/home/nodeuser/.ssh/id_rsa:ro
      - ~/lyra-store.json:/app/webapp/store.json
      - ./config:/app/config
```
