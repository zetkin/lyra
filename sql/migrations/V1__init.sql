CREATE TABLE IF NOT EXISTS project
(
    "id"           SERIAL PRIMARY KEY,
    "name"         VARCHAR(200) NOT NULL,
    "base_branch"  VARCHAR(200) NOT NULL,
    "project_path" VARCHAR(500) NOT NULL,
    "host"         VARCHAR(200) NOT NULL
);

COMMENT ON TABLE project IS 'Holds different projects for which translations are managed.';
COMMENT ON COLUMN project.name IS 'Name of the project.';
COMMENT ON COLUMN project.base_branch IS 'The base branch of the project repository.';
COMMENT ON COLUMN project.project_path IS 'The path to the project relative to the repository root.';
COMMENT ON COLUMN project.host IS 'The host of the project repository (e.g. github.com).';

CREATE TABLE IF NOT EXISTS language
(
    "id"      SERIAL PRIMARY KEY,
    "project" INTEGER REFERENCES project,
    "value"   CHAR(2) NOT NULL
);

COMMENT ON TABLE language IS 'Holds languages associated with projects.';
COMMENT ON COLUMN language.value IS 'Language code in ISO 639-1 format (e.g. en, de, fr).';
COMMENT ON COLUMN language.project IS 'Foreign key to the project this language belongs to.';

CREATE TABLE IF NOT EXISTS path
(
    "id"    SERIAL PRIMARY KEY,
    "value" TEXT NOT NULL
);

COMMENT ON TABLE path IS 'Holds file paths for source files.';
COMMENT ON COLUMN path.value IS 'The file path of the source file without filename (e.g. path/to).';

CREATE TABLE IF NOT EXISTS translation_key
(
    "id"           SERIAL PRIMARY KEY,
    "path"         INTEGER REFERENCES path,
    "value"        VARCHAR(200) NOT NULL,
    "default_text" VARCHAR(200) NOT NULL,
    "params"       TEXT
);

COMMENT ON TABLE translation_key IS 'Holds translation keys associated with source files,their default texts and parameters.';
COMMENT ON COLUMN translation_key.path IS 'Foreign key to the path this translation key belongs to.';
COMMENT ON COLUMN translation_key.value IS 'The key used to identify the translation (e.g. welcome.message).';
COMMENT ON COLUMN translation_key.default_text IS 'The default text for this translation key.';
COMMENT ON COLUMN translation_key.params IS 'Comma separated list of parameter names used in the translation text.';

CREATE TYPE "public"."translation_state" AS ENUM ('UPDATED', 'PUBLISHED');

CREATE TABLE IF NOT EXISTS translation
(
    "id"    SERIAL PRIMARY KEY,
    "key"   INTEGER REFERENCES translation_key,
    "text"  TEXT                NOT NULL,
    "state" "translation_state" NOT NULL
);

COMMENT ON TABLE translation IS 'Holds translations for translation keys.';
COMMENT ON COLUMN translation.key IS 'Foreign key to the translation key this translation belongs to.';
COMMENT ON COLUMN translation.text IS 'The translated text.';
COMMENT ON COLUMN translation.state IS 'The state of the translation (either UPDATED or PUBLISHED).';

