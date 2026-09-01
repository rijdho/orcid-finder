# orcid-finder: conventions

A single static page with no build step. `index.html` + `style.css` + ES modules under `src/`,
served verbatim by GitHub Pages. There is no bundler and no runtime dependency; keep it that way.

## The one architectural rule

**Every decision lives in a pure module; only `app.js` touches the DOM, and only `orcid.js`
touches the network.**

- `src/discover.js` holds the filters. Its functions are pure except `discoverPeople`, which
  takes its HTTP through a `deps` object. That is what lets `tests/discover.test.mjs` drive the
  whole filter chain offline with exact expected values.
- `src/ror.js` resolves a ROR id to its registered names. It exists for one reason, recorded
  below; it is not a convenience.
- `src/exporters.js` holds CSV and JSON. No DOM except `downloadText`, which no-ops outside a
  browser so Node can import the module.
- `src/app.js` moves values between the form and those modules. If a piece of logic is worth a
  test, it does not belong here.

Adding a filter therefore means: an option in `normaliseOptions`, its behaviour in
`matchSearchRow` or `matchEmployments`, a counter in the breakdown, a test with exact numbers,
three locale strings, and a control in `index.html`. In that order.

## Things that are the way they are on purpose

- **A ROR match is trusted even when the institution name differs.** `expanded-search` returns
  `institution-name[]` without per-entry ROR ids, so a genuine ROR hit can carry a differently
  worded name. Those rows are labelled `ror_only`, not dropped.
- **The breakdown uses a stage counter.** A rejection is attributed to the filter that actually
  rejected the candidate, not to the first filter in the chain. Reordering the checks without
  moving the stage assignments silently makes the counts fiction.
- **A null employments document is `unreachable`, not `noOrgMatch`.** Reporting a network
  failure as "this person does not work here" states a filter verdict the data does not
  support.
- **A partial end date is read at its latest instant.** Erring the other way deletes current
  staff from a roster in silence.
- **`maxRows` has no `step`.** With `min=1`, a step of 10 makes the browser silently reject the
  default 200 on submit.
- **ROR is resolved BEFORE the query is built, not alongside the search.** The lookup feeds two
  different things and one of them is the query: the GRID id goes into it, the registered names go
  into the employment match. Moving the lookup back to run in parallel with the search silently
  drops the GRID coverage.
- **Keywords are AND-ed, identifiers and names are OR-ed.** OR-ing a keyword would widen the
  search to everyone in ORCID carrying it, which is the opposite of narrowing an institution.
- **A current or past search drops the identifier criteria.** ORCID indexes those two only on the
  name fields, so leaving a ROR term in would return current staff in a search for former ones.
  `validateOptions` refuses that combination with its own message rather than a generic one.
- **The stage numbers ARE the order of the checks in `matchEmployments`.** A rejection is
  attributed to the check that comes next, and an inactive filter still advances the stage, so
  `REJECTED_BY` walks forward to the next active counter. Add a check without adding its stage and
  every count below it becomes fiction.
- **ROR ids are resolved to names before the employment checks run.** ORCID lets an employment
  be disambiguated with any scheme, and an institution's own integration frequently writes
  RINGGOLD or FUNDREF. Matching on the ROR id alone dropped every organisation-asserted record:
  Karolinska by ROR with the asserted-only filter returned nothing at all. Acronyms and names
  under four characters are excluded, because `KI` as a substring matches a large part of ORCID.
- **`assertedBy` is `null` in fast mode and `'unknown'` when the source is absent.** Neither is
  `'self'`. Filling either in would report a guess as a finding.
- **Every relative import carries `?v=N`, and every N is the same.** There is no bundler, so the
  query string is the only cache-buster. Versioning only the entry module once served a cached
  `orcid.js` against a fresh `ror.js` that imported a symbol it did not export: the module graph
  aborted with no visible error and the tool came up blank while looking deployed.
  `tests/cachebust.test.mjs` pins this; bump `index.html` and every import together.

## House rules inherited from the family

- Violet chrome (`#6d4aff` / `#8b7bff`), Inter self-hosted from `fonts/`, never a font CDN.
  The data palette (`--m-emp`, `--m-name`, `--m-ror`) is the only place colour carries meaning.
- `style.css` is linked with `?v=N`. Bump N on every stylesheet change or cached browsers keep
  the old one while the HTML updates.
- English, German and Spanish are the floor, not a goal. `tests/i18n.test.mjs` pins parity.
- Tests run on `node --test tests/*.test.mjs`, no dependencies. Prove a new test is not vacuous
  by injecting the defect it claims to catch.
