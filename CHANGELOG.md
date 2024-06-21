# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased

### Added

- Added openapi schema support for routes
- added adapter to generate openapi schema
- added more tests to Route class
- added express adapter

### Fixed

- Route was changed to Route() this prevented to use same instance of Routebuilder everywhere, which was a vulnerability
- Fixed tests and Improved codebase

## 0.0.1 - 2024-06-18

### Added

- Initial project setup with bun
- added github actions to manually release package on npm
- Added few starting tests for Route

### Fixed

- Incomplete command for beta release in Github action
- Code to install nodejs and npm in bun workflow
- NPM Registry auth token issue in bun workflow
