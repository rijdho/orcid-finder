# Changelog

All notable changes to this project are documented here. The format follows [Keep a
Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow [Semantic
Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

Nothing yet.

## [1.0.0] - 2026-09-01

First public version.

### Added

**Finding the institution.** Discovery against the ORCID public API by ROR id, by the GRID id
resolved from it, by Ringgold id and by organisation name, OR-ed into a single query. The GRID
id is added automatically because ORCID indexes ROR and GRID separately and the mapping is one
to one: for Karolinska Institutet, `ror-org-id` alone reports 4,206 accounts where `ror-org-id
OR grid-org-id` reports 5,318. The Ringgold id is typed in deliberately rather than derived,
because ROR does not carry Ringgold ids and a Ringgold id is coarser, covering related
organisations such as a university hospital; it takes the same institution to 9,547.

**Affiliation status: any, current or past.** ORCID indexes these as three separate name
fields, and `current OR past` returns exactly what `any` returns. Past is how former staff and
alumni are found, which nothing else here reaches. The identifier criteria sit out when a
status is chosen, because ORCID indexes current and past only on the name, and the tool says so
rather than silently returning current people.

**A keyword filter**, AND-ed onto the institution block so it narrows rather than widens, at no
extra request.

**Filters that read the employment record**: role title contains, role title must not contain,
department contains, country code, started-from and started-to years, must have a start date,
only current appointments, and only employments a member organisation asserted. These switch
the run into full mode, which reads one `/employments` document per candidate, six at a time,
with a progress bar and a Cancel that keeps what was already examined. Exclusion happens
against the record in hand because ORCID's query language has no negation, and `role-title` is
not a searchable field at all, which is why any role filter costs a request per candidate.

**Who asserted the employment**, read from ORCID's `source` field: a column naming the writer,
a filter that keeps only what a member organisation wrote, and three export columns
(`asserted_by`, `assertion_source`, `assertion_origin`). The difference between a claim and a
claim a second party stands behind was not visible in ORCID's own search.

**ROR name resolution.** Each ROR id is also resolved to the names the registry holds for it,
and those are matched against employments. Without this the affiliation check drops precisely
the organisation-asserted records, because an institution's own integration frequently stamps a
RINGGOLD or FUNDREF id rather than a ROR one: searching Karolinska by ROR with the
asserted-only filter returned nothing at all. Registered acronyms and names under four
characters are excluded, because a needle that matches everything turns the filter off while
the result still looks filtered. The names used are shown with the result and carried in the
JSON export.

**Per-filter drop counts**, attributed to the filter that actually rejected each candidate,
with a separate count of records that could not be read at all, so a network failure is never
reported as a filter verdict.

**CSV and JSON export** of the whole result. CSV is RFC 4180 with CRLF and spreadsheet-formula
neutralisation; JSON additionally carries the query, mode, filter set, resolved names and GRID
ids, totals and drop counts, so a result file can be checked and repeated on its own.

**The search is mirrored into the URL** and re-runs on load, which makes a result linkable.

**English, German and Spanish**, auto-detected from the browser and switchable, with key and
placeholder parity pinned by tests. Light and dark themes, with the `data-theme` override
beating `prefers-color-scheme` in both directions.

**104 tests** on Node's built-in runner across four layers (filter logic, export, i18n, and the
wiring between the page, the script and the stylesheet), validated by injecting deliberate
defects and confirming each turned the suite red. One of those injections proved a branch
unreachable and it was removed rather than kept.

**A Content-Security-Policy of `default-src 'none'`**, so the page's central claim is enforced by
the browser rather than promised: scripts, styles and fonts only from this origin, and connections
only to `pub.orcid.org` and `api.ror.org`. Everything the two APIs return is escaped before it
reaches the page; the policy is what stands behind that if an escape is ever missed. Pinned by
tests to the hosts the code actually calls. Clickjacking is not covered, because `frame-ancestors`
needs a response header that GitHub Pages cannot set.

**`docs/screenshots.mjs`**, which drives the real app with Puppeteer so the README images can
be regenerated rather than quietly aging.
