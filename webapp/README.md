# Lyra web app

## Running in development
For the time being, you need to supply the path to a repository containing
Lyra messages (`messageIds.ts` files) using an environment variable called
`REPO_PATH, GITHUB_AUTH, GITHUB_OWNER, GITHUB_REPO`, like so:

```
REPO_PATH= <<local_path_to_repo>>
GITHUB_AUTH= <<TOKER>>
GITHUB_OWNER=zetkin
GITHUB_REPO=app.zetkin.org
```

```
REPO_PATH=/path/to/app.zetkin.org yarn dev
```