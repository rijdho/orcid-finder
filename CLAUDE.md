# orcid-finder: conventions

A single static page with no build step. `index.html` + `style.css` + ES modules under `src/`,
served verbatim by GitHub Pages. There is no bundler and no runtime dependency; keep it that way.

## The one architectural rule

**Every decision lives in a pure module; only `app.js` touches the DOM, and only `orcid.js`
touches the network.**

- `src/discover.js` holds the filters. Its functions are pure except `discoverPeople`, which
  takes its HTTP through a `deps` object. That is what lets `tests/discover.test.mjs` drive the
  whole filter chain offline with exact expected values.
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
  failure as "this person does not work here" is the one wrong answer this tool must not give.
- **A partial end date is read at its latest instant.** Erring the other way deletes current
  staff from a roster in silence.
- **`maxRows` has no `step`.** With `min=1`, a step of 10 makes the browser silently reject the
  default 200 on submit.

## House rules inherited from the family

- Violet chrome (`#6d4aff` / `#8b7bff`), Inter self-hosted from `fonts/`, never a font CDN.
  The data palette (`--m-emp`, `--m-name`, `--m-ror`) is the only place colour carries meaning.
- `style.css` is linked with `?v=N`. Bump N on every stylesheet change or cached browsers keep
  the old one while the HTML updates.
- English, German and Spanish are the floor, not a goal. `tests/i18n.test.mjs` pins parity.
- Tests run on `node --test tests/*.test.mjs`, no dependencies. Prove a new test is not vacuous
  by injecting the defect it claims to catch.
