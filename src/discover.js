// Discovery: turn a set of filters into a list of ORCID accounts.
//
// The filter set is the one grown by the DART CRIS roster tool, lifted out of its
// database and made to stand alone. Two modes, chosen automatically by which
// filters are active:
//
//   fast: one expanded-search call, matched on the institution-name[] ORCID
//          returns with each hit. Seconds, whatever the size of the result.
//   full: additionally reads /employments for every candidate, which is the only
//          way ORCID exposes role title, start date and whether the appointment
//          has ended. One HTTP request per candidate, so it is entered only when
//          a filter actually needs employment data.
//
// Everything here except `discoverPeople` is pure, and `discoverPeople` takes its
// HTTP through `deps`, which is what makes the whole filter behaviour testable
// without a network.

import { expandedSearch, fetchEmployments } from './orcid.js';

/** A ROR id is nine characters, starts with 0, and uses a crockford-ish alphabet. */
export const ROR_RE = /^0[a-hj-km-np-z0-9]{8}$/;

export const ORCID_RE = /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/;

/** Strip the resolver prefix and case, so `https://ror.org/03YRM5C26` == `03yrm5c26`. */
export const normaliseRor = (s) =>
  String(s ?? '').trim().replace(/^https?:\/\/ror\.org\//i, '').toLowerCase();

export const isValidRor = (s) => ROR_RE.test(normaliseRor(s));

/** Split a comma-separated input box into a clean, de-duplicated list. */
export const parseList = (s) => [
  ...new Set(String(s ?? '').split(',').map((x) => x.trim()).filter(Boolean)),
];

export const DEFAULT_OPTIONS = {
  rors: [],
  orgNames: [],
  byRor: true,
  byName: true,
  roleTitles: [],
  requireStartDate: false,
  currentOnly: false,
  maxRows: 200,
};

/** Fill in the defaults and normalise the free-text fields exactly once. */
export function normaliseOptions(o = {}) {
  const rors = (o.rors ?? []).map(normaliseRor).filter(Boolean);
  return {
    ...DEFAULT_OPTIONS,
    ...o,
    rors: [...new Set(rors)],
    orgNames: [...new Set((o.orgNames ?? []).map((n) => String(n).trim()).filter(Boolean))],
    roleTitles: (o.roleTitles ?? []).map((s) => String(s).trim()).filter(Boolean),
    maxRows: Math.min(Math.max(parseInt(o.maxRows ?? 200, 10) || 200, 1), 1000),
  };
}

/**
 * Build the ORCID query string. Criteria are OR-ed: an account qualifies by
 * declaring ANY of the ROR ids or ANY of the organisation names. Returns null
 * when nothing is selected, which the caller must treat as "ask the user", not
 * as "no results".
 */
export function buildQuery(o) {
  const opts = normaliseOptions(o);
  const terms = [];
  if (opts.byRor) for (const r of opts.rors) terms.push(`ror-org-id:"https://ror.org/${r}"`);
  if (opts.byName) for (const n of opts.orgNames) terms.push(`affiliation-org-name:"${n}"`);
  return terms.length ? terms.join(' OR ') : null;
}

/** Which criteria are usable: a ticked box with an empty field is not one. */
export function activeCriteria(o) {
  const opts = normaliseOptions(o);
  return {
    ror: opts.byRor && opts.rors.length > 0,
    name: opts.byName && opts.orgNames.length > 0,
  };
}

/** Do the active filters need the per-candidate employments call? */
export function needsEmployments(o) {
  const opts = normaliseOptions(o);
  return opts.roleTitles.length > 0 || !!opts.requireStartDate || !!opts.currentOnly;
}

/** The display name ORCID gives us, with the same precedence the API documents. */
export const nameOf = (r) =>
  [r['given-names'], r['family-names']].filter(Boolean).join(' ') || r['credit-name'] || r['orcid-id'];

/** ORCID dates are per-part objects; render the most precise ISO prefix available. */
export function formatOrcidDate(d) {
  const y = d?.year?.value;
  if (!y) return null;
  const m = d?.month?.value ? String(d.month.value).padStart(2, '0') : null;
  const day = d?.day?.value ? String(d.day.value).padStart(2, '0') : null;
  return m ? (day ? `${y}-${m}-${day}` : `${y}-${m}`) : String(y);
}

/**
 * Has this appointment ended as of `today`?
 *
 * A partial end date is read at its LATEST possible instant (December, the 28th)
 * so that "ended 2026" does not drop someone on the 2nd of January of that year.
 * Erring the other way would silently delete current staff from the result.
 */
export function hasEnded(end, today = new Date()) {
  const y = end?.year?.value;
  if (!y) return false;
  const endDate = new Date(
    parseInt(y, 10),
    (end.month?.value ? parseInt(end.month.value, 10) : 12) - 1,
    end.day?.value ? parseInt(end.day.value, 10) : 28,
  );
  return endDate < today;
}

/** Lower-cased needles, computed once per run rather than once per candidate. */
function needles(opts) {
  return {
    rors: new Set(opts.rors),
    names: opts.orgNames.map((n) => n.toLowerCase()),
    roles: opts.roleTitles.map((s) => s.toLowerCase()),
  };
}

/**
 * Fast mode: decide on one search row, using only what expanded-search returned.
 *
 * When ROR is one of the criteria we trust ORCID's own match even if the
 * institution names it reports do not string-match ours, because expanded-search returns
 * `institution-name[]` with no per-entry ROR id, so a genuine ROR hit can carry a
 * differently-worded name. Dropping those would throw away exactly the records the
 * ROR criterion was chosen to find.
 */
export function matchSearchRow(row, opts, n = needles(normaliseOptions(opts))) {
  const o = normaliseOptions(opts);
  const instNames = (row['institution-name'] ?? []).map((x) => String(x).toLowerCase());
  const matchesName = instNames.some((name) => n.names.some((needle) => name.includes(needle)));
  const rorTrusted = o.byRor && o.rors.length > 0;
  if (!matchesName && instNames.length > 0 && !rorTrusted) return null;
  return {
    orcid: row['orcid-id'],
    name: nameOf(row),
    givenName: row['given-names'] ?? null,
    familyName: row['family-names'] ?? null,
    roleTitle: null,
    department: null,
    organization: row['institution-name']?.[0] ?? o.orgNames[0] ?? null,
    startDate: null,
    endDate: null,
    institutions: row['institution-name'] ?? [],
    matchedBy: matchesName ? 'name' : 'ror_only',
  };
}

/**
 * Full mode: decide on one candidate from their employments document.
 *
 * `stage` records how far the candidate got, so a rejection is attributed to the
 * filter that actually dropped it rather than to the first one in the list:
 *   0 no employment names us · 1 org ok · 2 role ok · 3 start-date ok · 4 kept.
 * Without it the breakdown shown to the user is fiction, and a filter that is
 * quietly doing nothing looks identical to one doing all the work.
 */
export function matchEmployments(data, row, opts, today = new Date(), n = needles(normaliseOptions(opts))) {
  const o = normaliseOptions(opts);
  let stage = 0;
  for (const group of data?.['affiliation-group'] ?? []) {
    for (const s of group?.summaries ?? []) {
      const emp = s['employment-summary'] ?? s;
      const org = emp.organization ?? {};
      const empRor = normaliseRor(
        org['disambiguated-organization']?.['disambiguated-organization-identifier'] ?? '',
      );
      const empName = String(org.name ?? '').toLowerCase();

      const hit =
        (!!empRor && n.rors.has(empRor)) || n.names.some((needle) => empName.includes(needle));
      if (!hit) continue;
      stage = Math.max(stage, 1);

      if (n.roles.length) {
        const role = String(emp['role-title'] ?? '').toLowerCase();
        if (!n.roles.some((rt) => role.includes(rt))) continue;
      }
      stage = Math.max(stage, 2);

      const start = emp['start-date'];
      if (o.requireStartDate && !start?.year?.value) continue;
      stage = Math.max(stage, 3);

      const end = emp['end-date'];
      if (o.currentOnly && hasEnded(end, today)) continue;

      return {
        stage: 4,
        person: {
          orcid: row['orcid-id'],
          name: nameOf(row),
          givenName: row['given-names'] ?? null,
          familyName: row['family-names'] ?? null,
          roleTitle: emp['role-title'] ?? null,
          department: emp['department-name'] ?? null,
          organization: org.name ?? null,
          startDate: formatOrcidDate(start),
          endDate: formatOrcidDate(end),
          institutions: row['institution-name'] ?? [],
          matchedBy: 'employment',
        },
      };
    }
  }
  return { stage, person: null };
}

/** A breakdown counter is null, not 0, when its filter was not applied at all. */
function emptyBreakdown(o) {
  return {
    noOrgMatch: 0,
    noRoleMatch: o.roleTitles.length ? 0 : null,
    noStartDate: o.requireStartDate ? 0 : null,
    pastEmployment: o.currentOnly ? 0 : null,
    unreachable: 0,
  };
}

/**
 * Run a discovery.
 *
 * `deps` carries the HTTP so tests can drive the whole filter chain offline:
 *   { search, employments, get, signal, concurrency, onProgress }
 */
export async function discoverPeople(options, deps = {}) {
  const o = normaliseOptions(options);
  const query = buildQuery(o);
  const breakdown = emptyBreakdown(o);
  if (!query)
    return { people: [], breakdown, totalFound: 0, scanned: 0, query: '', mode: 'fast', aborted: false };

  const search = deps.search ?? ((q, max) => expandedSearch(q, max, deps));
  const employments = deps.employments ?? ((id) => fetchEmployments(id, deps));
  const onProgress = deps.onProgress ?? (() => {});
  const concurrency = deps.concurrency ?? 6;
  const today = deps.today ?? new Date();
  const n = needles(o);

  onProgress({ phase: 'search', done: 0, total: o.maxRows });
  const { rows, totalFound } = await search(query, o.maxRows);
  const full = needsEmployments(o);
  const base = { breakdown, totalFound, scanned: rows.length, query, mode: full ? 'full' : 'fast' };

  if (!full) {
    const people = [];
    for (const row of rows) {
      const person = matchSearchRow(row, o, n);
      if (person) people.push(person);
      else breakdown.noOrgMatch++;
    }
    onProgress({ phase: 'done', done: rows.length, total: rows.length });
    return { ...base, people, aborted: false };
  }

  const people = [];
  let done = 0;
  for (let i = 0; i < rows.length; i += concurrency) {
    if (deps.signal?.aborted) return { ...base, people, scanned: done, aborted: true };
    const batch = rows.slice(i, i + concurrency);
    const outcomes = await Promise.all(
      batch.map(async (row) => {
        const data = await employments(row['orcid-id']);
        // null is a failed request, not an empty record: counting it as "no
        // affiliation match" would report a network problem as a filter verdict.
        if (data == null) return { stage: -1, person: null };
        return matchEmployments(data, row, o, today, n);
      }),
    );
    for (const res of outcomes) {
      if (res.person) people.push(res.person);
      else if (res.stage === -1) breakdown.unreachable++;
      else if (res.stage === 3) breakdown.pastEmployment = (breakdown.pastEmployment ?? 0) + 1;
      else if (res.stage === 2) breakdown.noStartDate = (breakdown.noStartDate ?? 0) + 1;
      else if (res.stage === 1) breakdown.noRoleMatch = (breakdown.noRoleMatch ?? 0) + 1;
      else breakdown.noOrgMatch++;
    }
    done += batch.length;
    onProgress({ phase: 'employments', done, total: rows.length });
  }
  onProgress({ phase: 'done', done, total: rows.length });
  return { ...base, people, aborted: false };
}
