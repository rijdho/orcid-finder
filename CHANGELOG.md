# Changelog

All notable changes to this project are documented here. The format follows [Keep a
Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow [Semantic
Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.3.1] - 2026-09-04

### Fixed

- **v1.3.0 shipped four changed modules under the cache-busting version they already had.**
  `src/exporters.js` and the three locale files were rewritten but kept `?v=11`, which they had
  carried since v1.2.0. There is no bundler here, so that query string is the only thing that
  makes a browser fetch a file it already holds: GitHub Pages serves these with
  `cache-control: max-age=600`, so a returning visitor kept the v1.2.0 modules for the length of
  that window and got a CSV with no split columns, signed `v1.2.0`, from a v1.3.0 page. Nothing
  broke loudly, which is what made it worth fixing rather than waiting out. Every URL is now at
  `?v=13`.

### Added

- **An asset lock, so this cannot be forgotten again.** `tests/assets.lock.json` records the
  version together with a hash of every file the `?v=` covers, and `tests/cachebust.test.mjs`
  fails when the tree and the lock disagree. The existing test only proved the versions agreed
  *with each other*, which they did at 11 while four files changed underneath them; agreement was
  never the property that mattered.

  `node tests/assets-lock.mjs --write` records a new lock and **refuses to record a changed hash
  under an unchanged version**. Without that refusal, relocking would be a way to make the failure
  go away without fixing it, which is worse than no guard because it would look handled. The
  refusal is a pure function, so the test exercises it without a test writing to the repository.

  `fonts/` is deliberately outside the lock: those are referenced from `style.css` by a bare path
  with no version, so locking them would promise a protection that does not exist.

## [1.3.0] - 2026-09-04

Version DOI: [10.5281/zenodo.22295998](https://doi.org/10.5281/zenodo.22295998).

### Added

- **The "also known as" list is split into one column per name.** `other_name_1`, `other_name_2`
  and so on join the CSV, because a spreadsheet cannot sort or filter inside a cell and a
  pipe-joined list was the wrong shape for the work these names are for. Three decisions are
  deliberate. The block **follows every fixed column** rather than sitting beside `other_names`:
  a variable-width block in the middle would move `role_title` and everything after it between
  two runs that differ only in their data, and a reader working by position would break on that.
  It is **sized to the widest account in the result rather than capped**, because a cap silently
  truncates the record it was set too low for, and a truncated name is worse than a wide file. It
  is **absent entirely when nobody in the result declares a variant**, which measurement says is
  the ordinary case: across 900 accounts at three institutions, 94.3% declare none, 4.6% one,
  0.9% two and 0.2% three.
- **A test pins the sample preamble printed in the README to the shipped version.** It sits in a
  block a reader copies to recognise the file, and a version number written into prose rots at
  the next release.

### Changed

- `other_names` **stays exactly as it was**, joined and unsplit, so nothing that reads the 1.2.0
  CSV breaks. It and the split columns are built from one list, and a test pins that the two
  cannot disagree. The JSON export keeps the joined form alone: nothing there needs splitting,
  and this is the one place the two formats deliberately differ.
- A blank entry in ORCID's `other-name` is now dropped rather than exported as a stray `" | "`
  in the joined column.

## [1.2.0] - 2026-09-03

Version DOI: [10.5281/zenodo.22285905](https://doi.org/10.5281/zenodo.22285905).

### Added

- **The CSV signs itself.** It opens with `#` comment lines naming the tool, its version, its
  concept DOI, the licence, the data sources, the timestamp, the query sent to ORCID, the mode
  and the counts. The JSON export has carried this since it existed; the CSV is the file that
  actually gets opened, mailed on and pasted into a supplementary table, and it was the one
  leaving with no name on it. `#` is a convention rather than part of RFC 4180, so a reader with
  no comment handling parses those lines as rows: a checkbox above the table turns the signature
  off, and the hint names the incantation for pandas and R.
- **Name variants.** `credit_name` and `other_names` join the export, and the table shows them
  under the display name as "also known as". Both fields come back from `expanded-search`
  itself, so they cost no extra request and are as available in fast mode as in full. They
  matter because the display name is assembled from `given-names` and `family-names`, which are
  frequently a legal or transliterated form that no publication uses: ORCID 0000-0001-8690-8594
  reads as "James Abbott Eqdam" by that rule and publishes as "Aboozar Eghdam". In a live run of
  60 Karolinska accounts, 9 carried a variant.
- **The tool's identity is one constant, pinned to `CITATION.cff` by a test.** Version, concept
  DOI, URL, repository, licence and author now live in `TOOL` in `src/exporters.js` and are
  written into both exports from there. A second copy of a version number is a second chance to
  hand out a stale one, and the copy that ends up in a stranger's supplementary table is the one
  nobody can correct afterwards.

### Changed

- The export gains two columns, so a script reading the CSV by column position rather than by
  name needs updating: `credit_name` and `other_names` sit after `family_name`.

## [1.1.1] - 2026-09-03

Version DOI: [10.5281/zenodo.22274631](https://doi.org/10.5281/zenodo.22274631).

### Changed

- **The ceiling now says what it costs.** Raising it to 2000 made a full-mode run expensive
  without saying so anywhere: fast mode is one request per 100 candidates, but any filter in
  the middle column adds one per candidate, so 2000 candidates is roughly 2020 requests rather
  than 20. The hint says this in all three languages, and a Caveat carries the measurement:
  two runs against the live API at concurrency 6 took 36 s for 120 candidates and 65 s for 360,
  which puts the ceiling in the region of several minutes. Stated as an order of magnitude
  rather than a figure, because it moves with the network and with ORCID's load.

## [1.1.0] - 2026-09-03

Version DOI: [10.5281/zenodo.22274103](https://doi.org/10.5281/zenodo.22274103).

### Added

- **The page shows its DOI.** A visitor writing a methods section can cite the tool without
  going to the repository to find the number. It sits in the rail, under the author and
  licence line, and is labelled in all three languages.
- **Both citation surfaces carry the Zenodo DOIs**: the concept-DOI badge under the README
  title, and `CITATION.cff` with the concept DOI at the top level so GitHub's "Cite this
  repository" widget resolves it, plus an `identifiers:` list holding the concept and the
  current version DOI.

### Fixed

- **A `?max=` in the URL was not clamped.** It skips the input's own `min`/`max`, so a link
  carrying `?max=999999` filled the field with that number and left it marked invalid, while
  the run itself was capped correctly by `normaliseOptions`. The form therefore stated
  something the run did not do. The arithmetic now lives in one exported `clampMaxRows`, which
  both the form and the URL go through, rather than in two copies of a `parseInt` that can
  drift apart.
- **A README screenshot published the wrong licence.** `docs/app.png` predated the switch to
  AGPL-3.0-or-later and still showed "MIT" in the page footer, so the README of an AGPL
  repository stated MIT to anyone reading the image rather than the text. No text search finds
  that; it took opening the file. It also still carried the Ringgold wording the overclaim fix
  replaced. Regenerated from `docs/screenshots.mjs` against the current tree.
- **An overclaim, in the README, the changelog, the interface in three languages and the
  release notes.** They said an institution's own integration "frequently" or "usually"
  stamps a RINGGOLD identifier rather than a ROR one. That was generalised from the single
  case that motivated the fix. Sampling twenty-five records at six institutions does not
  support it: only two had any organisation-asserted employments at all, one of those used
  RINGGOLD and the other was evenly split between RINGGOLD and ROR. The claim is now what
  was actually measured, that the identifier is not always ROR and may be RINGGOLD or
  FUNDREF, which is all the argument needed anyway. The coverage numbers and the 0-to-26
  result that motivated the whole thing were measured directly and stand unchanged.

### Changed

- **The max-candidates ceiling is 2000, up from 1000.** The old limit was not something ORCID
  imposes: paging `expanded-search` with `rows=100` was checked live at offsets up to 1990 and
  returns a full page throughout, so the ceiling was ours. It is raised in the input, in the
  clamp that `normaliseOptions` applies to a value typed past it, and in the hint in all three
  languages. The cost is unchanged in fast mode and doubles at worst in full mode, where every
  candidate is one further request.
- **Two controls that look like they overlap now say how they differ.** "Affiliation: current"
  asks ORCID which accounts its index calls current, on the organisation name alone;
  "Only current appointments" reads the end date on each employment we fetched. They are not
  the same question, and combining Past with the checkbox asks for people who hold both a
  finished and a running appointment at the institution, which is almost never the intent.
- **A start-date range makes "Must have a start date" a no-op**, since a range cannot be
  satisfied without a year: ticking both changes only which count reports the drop. The hint
  says so rather than leaving it to be discovered.

## [1.0.0] - 2026-09-01

Version DOI: [10.5281/zenodo.22227425](https://doi.org/10.5281/zenodo.22227425).

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
the organisation-asserted records, because an institution's own integration may stamp a
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
