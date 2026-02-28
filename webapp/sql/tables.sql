CREATE TABLE IF NOT EXISTS project
(
    id           SERIAL PRIMARY KEY,
    "name"       VARCHAR(200) NOT NULL,
    base_branch  VARCHAR(200) NOT NULL,
    project_path VARCHAR(500) NOT NULL,
    host         VARCHAR(200) NOT NULL
);
COMMENT ON TABLE project IS 'Holds different projects for which translations are managed.';
COMMENT ON COLUMN project.name IS 'Name of the project.';
COMMENT ON COLUMN project.base_branch IS 'The base branch of the project repository.';
COMMENT ON COLUMN project.project_path IS 'The path to the project relative to the repository root.';
COMMENT ON COLUMN project.host IS 'The host of the project repository (e.g. github.com).';

CREATE TABLE IF NOT EXISTS lang
(
    id     CHAR(2) PRIMARY KEY,
    "name" VARCHAR(200) NOT NULL
);

COMMENT ON TABLE lang IS 'Holds languages associated with projects.';
COMMENT ON COLUMN lang.id IS 'Language code in ISO 639-1 format (e.g. en, de, fr).';
COMMENT ON COLUMN lang.name IS 'The name of the language in english.';

CREATE TABLE IF NOT EXISTS project_lang
(
    id      SERIAL PRIMARY KEY,
    project INTEGER REFERENCES project,
    lang    CHAR(2) REFERENCES lang
);

COMMENT ON TABLE project_lang IS 'Maps the project to its supported languages';
COMMENT ON COLUMN project_lang.project IS 'The project that supports a language';
COMMENT ON COLUMN project_lang.lang IS 'The language that project supports';


CREATE TABLE IF NOT EXISTS path
(
    id      SERIAL PRIMARY KEY,
    project INTEGER REFERENCES project,
    value   TEXT NOT NULL
);

COMMENT ON TABLE path IS 'Holds file paths for source files.';
COMMENT ON COLUMN path.project IS 'Foreign key to the project this path belongs to.';
COMMENT ON COLUMN path.value IS 'The file path of the source file without filename (e.g. path/to).';

CREATE TABLE IF NOT EXISTS i18n_key
(
    id           SERIAL PRIMARY KEY,
    path         INTEGER REFERENCES path,
    value        VARCHAR(200) NOT NULL,
    default_text VARCHAR(200) NOT NULL,
    params       TEXT
);

COMMENT ON TABLE i18n_key IS 'Holds i18n keys associated with source files, their default texts and parameters.';
COMMENT ON COLUMN i18n_key.path IS 'Foreign key to the path this i18n belongs to.';
COMMENT ON COLUMN i18n_key.value IS 'The key used to identify the translation (e.g. welcome.message).';
COMMENT ON COLUMN i18n_key.default_text IS 'The default text for this i18n.';
COMMENT ON COLUMN i18n_key.params IS 'Comma separated list of parameter names used in the translation text.';

CREATE TYPE public.translation_state AS ENUM ('UPDATED', 'PUBLISHED');

CREATE TABLE IF NOT EXISTS translation
(
    id    SERIAL PRIMARY KEY,
    key   INTEGER REFERENCES i18n_key,
    lang  CHAR(2) REFERENCES lang,
    text  TEXT              NOT NULL,
    state translation_state NOT NULL
);

COMMENT ON TABLE translation IS 'Holds translations for i18n keys.';
COMMENT ON COLUMN translation.key IS 'Foreign key to the i18n key this translation belongs to.';
COMMENT ON COLUMN translation.lang IS 'The language of this translation.';
COMMENT ON COLUMN translation.text IS 'The translated text.';
COMMENT ON COLUMN translation.state IS 'The state of the translation (either UPDATED or PUBLISHED).';

