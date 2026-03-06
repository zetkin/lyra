# Lyra Backend

Kotlin/JVM backend for Lyra — a tool that manages i18n translations across Git-hosted projects. It clones repositories, syncs project and translation metadata into a local SQLite database, and exposes an HTTP API for browsing messages, submitting translations, and creating pull requests.

---

## Features

- **Repository sync**: clones and polls configured Git repositories on a configurable interval; detects new commits and re-syncs automatically
- **Message ingestion**: parses TypeScript source files to extract i18n keys, default texts, and named parameters
- **Translation sync**: reads existing YAML translation files and stores them in the database with state tracking (`PUBLISHED` → `SUBMITTED` → `PART_OF_PULL_REQUEST`)
- **Translation submission**: accepts translated texts via the API; validates that all named parameters from the source key are present in the submitted text
- **Pull request creation**: creates a Git branch, patches only the changed lines in the affected YAML files (preserving existing formatting), commits and pushes, then opens a GitHub pull request
- **PR lifecycle tracking**: periodically checks open PRs and marks translations as `PUBLISHED` once the PR is merged, or closes them if the PR is closed without merging
- **OpenAPI spec**: served at `GET /openapi.yaml`; a TypeScript fetch client can be generated from it via `./gradlew openApiGenerate`

---

## Configuration

### `repositories.yaml`

Located at the **backend root** (same directory as `build.gradle.kts`). Defines which repositories to manage:

```yaml
repositories:
  - name: my-project        # used as the repo identifier in all API routes
    base_branch: main
    owner: github-org
    host: github.com        # optional, defaults to github.com
    github_token: ghp_...   # GitHub PAT with repo read/write permissions
    ssh_url: git@github.com:github-org/my-project.git
```

### `.lyra.yaml`

Located at the **root of each cloned repository**. Defines the projects within that repository:

```yaml
version: 1
projects:
  - path: .                 # path to the project root within the repo
    messages:
      format: ts
      path: src             # where TypeScript source files with i18n keys live
    translations:
      path: src/locale      # where YAML translation files live (one file per language, e.g. de.yml)
    languages:
      - da
      - de
      - en
```

### Environment variables

| Variable                | Default               | Description                                               |
|-------------------------|-----------------------|-----------------------------------------------------------|
| `PORT`                  | `8080`                | HTTP server port                                          |
| `REPOS_DIR`             | `/opt/lyra-repos`     | Directory where repositories are cloned                   |
| `SSH_KEY_FILE`          | `id_rsa`              | SSH key **filename** in `~/.ssh/` (not a full path)       |
| `SYNC_INTERVAL_SECONDS` | `300`                 | How often to poll repositories for new commits            |
| `GIT_USER_NAME`         | `Lyra Translator Bot` | Commit author name used when pushing translation branches |
| `GIT_USER_EMAIL`        | `lyra@zetkin.org`     | Commit author email                                       |
| `DEBUG`                 | `false`               | Enable debug logging                                      |

For local development, create a `.env` file at the **Lyra root** (one level above `backend/`). It is loaded automatically at startup and takes precedence over defaults, but is overridden by actual environment variables.

---

## Running Locally

```bash
# From the backend/ directory
./gradlew run
```

The `lyra_data.db` SQLite file is created in `backend/`. Delete it when the schema changes during development.

## Gradle Tasks

```bash
./gradlew run              # run locally (loads ../.env automatically)
./gradlew compileKotlin    # compile only (fast feedback on errors)
./gradlew build            # compile + all tests
./gradlew dockerBuild      # build Docker image tagged lyra-backend:<version>
./gradlew openApiGenerate  # generate TypeScript fetch client into ../webapp/src/api/generated/
```

## Docker

Build and run via docker-compose from the Lyra root. To build the image manually:

```bash
./gradlew dockerBuild
# or
docker build --build-arg JDK_VERSION=25 -t lyra-backend:latest .
```

---

## API

The full spec is in `src/main/resources/openapi.yaml` and served live at `GET /openapi.yaml`.

| Method | Path                                                                       | Description                                                      |
|--------|----------------------------------------------------------------------------|------------------------------------------------------------------|
| `GET`  | `/api/repositories`                                                        | List all configured repositories                                 |
| `GET`  | `/api/repository/{repositoryName}/projects`                                      | List projects with language stats                                |
| `GET`  | `/api/repository/{repositoryName}/projects/{projectId}/messages`                 | Paged message list; filter by `lang`, `state`, `offset`, `limit` |
| `GET`  | `/api/repository/{repositoryName}/projects/{projectId}/messages/{i18nKey}`       | Single message with translations                                 |
| `POST` | `/api/repository/{repositoryName}/projects/{projectId}/messages/{i18nKey}?lang=` | Submit a translation                                             |
| `POST` | `/api/repository/{repositoryName}/pull-request`                                  | Create a PR for all submitted translations                       |

### Translation states

| State                  | Meaning                                       |
|------------------------|-----------------------------------------------|
| `PUBLISHED`            | Live on the base branch; synced from the repo |
| `SUBMITTED`            | Submitted via the API; not yet in a PR        |
| `PART_OF_PULL_REQUEST` | Included in an open Lyra PR                   |

When a PR is merged, all linked translations transition back to `PUBLISHED`. When a PR is closed without merging, the PR is marked `CLOSED` and translations remain `PART_OF_PULL_REQUEST` until the next sync.
