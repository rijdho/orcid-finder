# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Who asserted the employment**, read from ORCID's `source` field: a column naming the writer,
  a filter that keeps only the employments a member organisation wrote, and three export columns
  (`asserted_by`, `assertion_source`, `assertion_origin`). The difference between a claim and a
  claim a second party stands behind was invisible until now.
- **ROR name resolution.** Each ROR id is resolved to the names the registry holds for it and
  those are matched on too, so employments disambiguated with RINGGOLD or FUNDREF are recognised.
  Registered acronyms and names under four characters are excluded, because a needle that matches
  everything turns the filter off while the result still looks filtered. The names used are shown
  with the result and carried in the JSON export.

### Fixed

- **Organisation-asserted employments were being dropped by the ROR match.** Institutions'
  own ORCID integrations often stamp a RINGGOLD id rather than a ROR one, so matching employments
  on the ROR id alone discarded exactly the most corroborated records: Karolinska by ROR with the
  asserted-only filter returned nothing. Resolving the ROR id to its names is what fixes it.
- **A linked search emptied itself.** The boot sequence wrote the query string before reading it,
  so opening a URL that carried a search produced a blank form.

### Changed

- The interface moves onto the family's rail and command-bar shell, with How it works, Caveats
  and About as views in the rail rather than accordions under the tool.

## [1.0.0] - 2026-08-31

First public version. Cut when the repository was opened; the tag and the GitHub Release
follow, and the Zenodo DOIs are added to `CITATION.cff` and the README in the commit after
Zenodo has minted them.

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
