# Lyra web app

## Running in development

For the time being, you need to supply the path to a repository containing
Lyra messages (`messageIds.ts` files) using an environment variable called
in config folder create file `./config/projects.yaml` with example content:

```yaml
projects:
  - name: example-unique-name
    local_path: << local path to project >>
    sub_project_path: .
    host: github.com
    owner: amerharb
    repo: zetkin.app.zetkin.org
    github_token: << github token >>
```

also the project repository needs to be cloned locally. and has in the root folder config file `lyra.yml` with the
example content:

```yaml
baseBranch: main
projects:
  - path: .
    messages:
      format: ts
      path: src
    translations:
      path: src/locale
```
