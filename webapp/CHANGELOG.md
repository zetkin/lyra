# Changelog

<!-- https://keepachangelog.com/en/1.0.0/ -->

## [0.3.1] 2023-12-27

### Added

- Both LyraConfig and LyraConfigFile use method `get` to read config
- Configs are now cached in memory to TTL 1 hour
- method `get` has optional parameter `useCache` to force reload config from file

### Changed
- Function `readFromDir()` and `read()` in `LyraConfig` and `ServerConfig` are now private

## [0.3.0] 2023-12-21

### Added

- Server config file `./config/projects.yaml` to support multi project and multi repository
- New API endpoint to get all projects in a list that is configured at server in `./config/projects.yaml`
  ```http request
  GET http://example.com/api/projects
  ```
- New page to list all projects and languages
  ```
  http://example.com/projects
  ```

### Changed

- Api url to include project name in path
  ```http request
  GET http://example.com/api/translations/<projectName>/sv
  ```
- Web page url to include which project to load
  ```
  http://example.com/projects/<projectName>/sv
  ```

## [0.2.5] 2023-12-21

### Changed

- remove error logging

## [0.2.4] 2023-12-20

### Changed

- Web page only load 50 messages at a time

## [0.2.3] 2023-12-19

### Changed

- Become part of npm workspaces package
- Move devDependencies to root package

## [0.2.2] 2023-12-16

### Fixed

- Bug: adapter is not loading `en` language

## [0.2.1] 2023-12-05

### Added

- Run build and test in GitHub action
- Base Branch config to lyra.yml

### Changed

- Rename classes name YAMLTranslate to YamlTranslate and TSMessage to TsMessage to follow naming convention

## [0.2.0] 2023-12-04

### Added

- adaptor
- Unit test

## [0.1.3] 2023-12-01

### Fixed

- Bug: The case when there is more than one variable in message-id

## [0.1.2] 2023-12-01

### Changed

- in memory translate object become flat object of message id and text

## [0.1.1] 2023-11-24

### Changed

- fix PR name and commit message
