# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- ORCID account discovery against the public API, by ROR id and by organisation name, with the
  criteria OR-ed into one `expanded-search` query.
- Employment filters (role title contains, must have a start date, only current appointments),
  which switch the run into full mode and read `/employments` per candidate, six at a time, with
  a progress bar and a working Cancel.
- Per-filter drop counts attributed to the filter that actually rejected each candidate, plus a
  separate count of records that could not be read at all, so a network failure is never
  reported as a filter verdict.
- CSV and JSON export of the whole result. CSV is RFC 4180 with CRLF and spreadsheet-formula
  neutralisation; JSON additionally carries the query, mode, filter set and drop counts, so a
  result file is reproducible on its own.
- The search is mirrored into the URL and re-runs on load, which makes a result linkable.
- English, German and Spanish, auto-detected from the browser and switchable, with key and
  placeholder parity pinned by tests.
- Light and dark themes, with the `data-theme` override beating `prefers-color-scheme` in both
  directions.
- 54 tests on Node's built-in runner across three layers (filter logic, export, i18n), validated
  by injecting five deliberate defects and confirming each turned the suite red.
- `docs/screenshots.mjs`, which drives the real app with Puppeteer so the README images can be
  regenerated rather than quietly aging.
