-- Holds different projects for which translations are managed.
CREATE TABLE IF NOT EXISTS project
(
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    "name"       TEXT NOT NULL,  -- Name of the project.
    base_branch  TEXT NOT NULL,  -- The base branch of the project repository.
    project_path TEXT NOT NULL,  -- The path to the project relative to the repository root.
    host         TEXT NOT NULL   -- The host of the project repository (e.g. github.com).
);

-- Holds languages associated with projects.
CREATE TABLE IF NOT EXISTS lang
(
    id     TEXT PRIMARY KEY,     -- Language code in ISO 639-1 format (e.g. en, de, fr).
    "name" TEXT NOT NULL         -- The name of the language in english.
);

-- Maps the project to its supported languages.
CREATE TABLE IF NOT EXISTS project_lang
(
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    project INTEGER REFERENCES project, -- The project that supports a language.
    lang    TEXT REFERENCES lang,       -- The language that project supports.
    UNIQUE(project, lang)
);

-- Holds file paths for source files.
CREATE TABLE IF NOT EXISTS path
(
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    project INTEGER REFERENCES project, -- Foreign key to the project this path belongs to.
    value   TEXT NOT NULL               -- The file path of the source file without filename (e.g. path/to).
);

-- Holds i18n keys associated with source files, their default texts and parameters.
CREATE TABLE IF NOT EXISTS i18n_key
(
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    path         INTEGER REFERENCES path, -- Foreign key to the path this i18n key belongs to.
    value        TEXT NOT NULL,           -- The key used to identify the translation (e.g. welcome.message).
    default_text TEXT NOT NULL,           -- The default text for this i18n key.
    params       TEXT,                    -- Comma separated list of parameter names used in the translation text.
    UNIQUE(path, value)
);

-- Holds translations for i18n keys.
CREATE TABLE IF NOT EXISTS translation
(
    id    INTEGER PRIMARY KEY AUTOINCREMENT,
    key   INTEGER REFERENCES i18n_key,  -- Foreign key to the i18n key this translation belongs to.
    lang  TEXT REFERENCES lang,         -- The language of this translation.
    text  TEXT NOT NULL,                -- The translated text.
    state TEXT NOT NULL                 -- The state of the translation (either UPDATED or PUBLISHED).
              CHECK (state IN ('UPDATED', 'PUBLISHED')),
    UNIQUE(key, lang)
);