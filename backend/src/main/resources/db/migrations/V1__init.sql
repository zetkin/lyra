-- Holds Git repositories configured in repositories.yaml.
CREATE TABLE IF NOT EXISTS repository
(
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    "name"      TEXT NOT NULL UNIQUE, -- Repository name (used as identifier in API routes).
    base_branch TEXT NOT NULL,        -- The base branch of the repository.
    host        TEXT NOT NULL,        -- The host of the repository (e.g. github.com).
    owner       TEXT NOT NULL         -- The owner of the repository.
);

-- Holds different projects for which translations are managed.
-- A project corresponds to one path entry in a repository's .lyra.yaml.
CREATE TABLE IF NOT EXISTS project
(
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    repo         INTEGER REFERENCES repository, -- The repository this project belongs to.
    project_path TEXT NOT NULL,                 -- The path to the project relative to the repository root (from .lyra.yaml).
    UNIQUE (repo, project_path)
);

-- Holds languages associated with projects.
CREATE TABLE IF NOT EXISTS lang
(
    id     TEXT PRIMARY KEY, -- Language code in ISO 639-1 format (e.g. en, de, fr).
    "name" TEXT NOT NULL     -- The name of the language in english.
);

-- Maps the project to its supported languages.
CREATE TABLE IF NOT EXISTS project_lang
(
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    project INTEGER REFERENCES project, -- The project that supports a language.
    lang    TEXT REFERENCES lang,       -- The language that project supports.
    UNIQUE (project, lang)
);

-- Holds file paths for source files.
CREATE TABLE IF NOT EXISTS path
(
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    project INTEGER REFERENCES project, -- Foreign key to the project this path belongs to.
    value   TEXT NOT NULL,              -- The file path of the source file.
    UNIQUE (project, value)
);

-- Holds i18n keys associated with source files, their default texts and parameters.
CREATE TABLE IF NOT EXISTS i18n_key
(
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    project      INTEGER REFERENCES project, -- Foreign key to the project this i18n key belongs to.
    path         INTEGER REFERENCES path,    -- Foreign key to the path this i18n key belongs to.
    value        TEXT NOT NULL,              -- The key used to identify the translation (e.g. welcome.message).
    default_text TEXT NOT NULL,              -- The default text for this i18n key.
    params       TEXT,                       -- Comma separated list of parameter names used in the translation text.
    UNIQUE (path, value)
);

-- Holds pull-requests created by Lyra.
CREATE TABLE IF NOT EXISTS pull_request
(
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    repo      INTEGER REFERENCES repository, -- The repository this PR belongs to.
    status    TEXT    NOT NULL               -- PR status.
        CHECK (status IN ('OPEN', 'CLOSED', 'MERGED')),
    pr_number INTEGER NOT NULL,              -- The PR number on the hosting platform.
    url       TEXT    NOT NULL,              -- The URL of the PR.
    branch    TEXT
);

-- Holds translations for i18n keys.
CREATE TABLE IF NOT EXISTS translation
(
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    key          INTEGER REFERENCES i18n_key,     -- Foreign key to the i18n key this translation belongs to.
    lang         TEXT REFERENCES lang,            -- The language of this translation.
    text         TEXT NOT NULL,                   -- The translated text.
    state        TEXT NOT NULL                    -- The state of the translation.
        CHECK (state IN ('PUBLISHED', 'SUBMITTED', 'PART_OF_PULL_REQUEST')),
    pull_request INTEGER REFERENCES pull_request, -- The pull request this translation is part of (nullable).
    UNIQUE (key, lang)
);
