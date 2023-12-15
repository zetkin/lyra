# Lyra web app

## Running in development
For the time being, you need to supply the path to a repository containing
Lyra messages (`messageIds.ts` files) using an environment variable called
`REPO_PATH, GITHUB_AUTH, GITHUB_OWNER, GITHUB_REPO`, like so:

```
REPO_PATH= <<local_path_to_repo>>
GITHUB_AUTH= <<TOKEN>>
GITHUB_OWNER=zetkin
GITHUB_REPO=app.zetkin.org
```

also the project reposotory needs to be cloned locally. and has in the root folder config file `lyra.yml` with the example content:
```yaml
baseBranch: main
projects:
- path: .
  messages:
    format: yaml
    path: locale
  translations:
    path: locale
```
