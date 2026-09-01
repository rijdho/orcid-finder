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

import { expandedSearch, fetchEmployments } from './orcid.js?v=4';
import { fetchRorFacts } from './ror.js?v=4';

/** A ROR id is nine characters, starts with 0, and uses a crockford-ish alphabet. */
export const ROR_RE = /^0[a-hj-km-np-z0-9]{8}$/;

export const ORCID_RE = /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/;

/** A Ringgold id is a bare number. They run to eight digits today. */
export const RINGGOLD_RE = /^\d{1,9}$/;

/** How the affiliation is searched. ORCID indexes these as three separate
 *  fields, and `current OR past` returns exactly what `any` returns. */
export const AFFILIATION_STATUS = ['any', 'current', 'past'];

/** Strip the resolver prefix and case, so `https://ror.org/03YRM5C26` == `03yrm5c26`. */
export const normaliseRor = (s) =>
  String(s ?? '').trim().replace(/^https?:\/\/ror\.org\//i, '').toLowerCase();

export const isValidRor = (s) => ROR_RE.test(normaliseRor(s));

/** Split a comma-separated input box into a clean, de-duplicated list. */
export const parseList = (s) => [
  ...new Set(String(s ?? '').split(',').map((x) => x.trim()).filter(Boolean)),
];

export const DEFAULT_OPTIONS = {
  // Who the institution is
  rors: [],
  ringgolds: [],
  orgNames: [],
  byRor: true,
  byName: true,
  affiliationStatus: 'any',
  // What the person works on
  keywords: [],
  // What the employment must look like
  roleTitles: [],
  excludeRoleTitles: [],
  departments: [],
  countries: [],
  startFrom: null,
  startTo: null,
  requireStartDate: false,
  currentOnly: false,
  assertedOnly: false,
  maxRows: 200,
};

/** Fill in the defaults and normalise the free-text fields exactly once. */
const clean = (list) => [...new Set((list ?? []).map((x) => String(x).trim()).filter(Boolean))];
const year = (v) => {
  const n = parseInt(v, 10);
  return Number.isInteger(n) && n > 0 ? n : null;
};

export function normaliseOptions(o = {}) {
  const status = AFFILIATION_STATUS.includes(o.affiliationStatus) ? o.affiliationStatus : 'any';
  return {
    ...DEFAULT_OPTIONS,
    ...o,
    rors: [...new Set((o.rors ?? []).map(normaliseRor).filter(Boolean))],
    ringgolds: clean(o.ringgolds),
    orgNames: clean(o.orgNames),
    affiliationStatus: status,
    keywords: clean(o.keywords),
    roleTitles: clean(o.roleTitles),
    excludeRoleTitles: clean(o.excludeRoleTitles),
    departments: clean(o.departments),
    countries: clean(o.countries).map((c) => c.toUpperCase()),
    startFrom: year(o.startFrom),
    startTo: year(o.startTo),
    maxRows: Math.min(Math.max(parseInt(o.maxRows ?? 200, 10) || 200, 1), 1000),
  };
}

/** The ORCID field that carries the organisation name, per affiliation status. */
const NAME_FIELD = {
  any: 'affiliation-org-name',
  current: 'current-institution-affiliation-name',
  past: 'past-institution-affiliation-name',
};

/**
 * Build the ORCID query string.
 *
 * The institution criteria are OR-ed: an account qualifies by declaring ANY of
 * the identifiers or ANY of the names. Keywords, when given, are AND-ed onto
 * that block, so they narrow the institution rather than widening the search.
 *
 * `facts.gridIds` are the GRID ids resolved from the ROR ids. ORCID indexes ROR
 * and GRID separately, so adding them is a coverage gain, not a synonym.
 *
 * Returns null when nothing is selected, which the caller must treat as "ask
 * the user", not as "no results".
 */
export function buildQuery(o, facts = {}) {
  const opts = normaliseOptions(o);
  const terms = [];

  // An identifier criterion cannot carry a current/past distinction: ORCID
  // indexes that only on the name fields. Including the ids anyway would return
  // current staff in a search for former ones, which is worse than refusing.
  if (opts.affiliationStatus === 'any') {
    if (opts.byRor) {
      for (const r of opts.rors) terms.push(`ror-org-id:"https://ror.org/${r}"`);
      for (const g of facts.gridIds ?? []) terms.push(`grid-org-id:"${g}"`);
    }
    for (const rg of opts.ringgolds) terms.push(`ringgold-org-id:"${rg}"`);
  }
  if (opts.byName)
    for (const n of opts.orgNames) terms.push(`${NAME_FIELD[opts.affiliationStatus]}:"${n}"`);

  if (!terms.length) return null;
  const affiliation = terms.join(' OR ');
  if (!opts.keywords.length) return affiliation;
  return `(${affiliation}) AND (${opts.keywords.map((k) => `keyword:"${k}"`).join(' OR ')})`;
}

/** Which criteria are usable: a ticked box with an empty field is not one. */
export function activeCriteria(o) {
  const opts = normaliseOptions(o);
  const byId = opts.affiliationStatus === 'any';
  return {
    ror: byId && opts.byRor && opts.rors.length > 0,
    ringgold: byId && opts.ringgolds.length > 0,
    name: opts.byName && opts.orgNames.length > 0,
  };
}

/**
 * What is wrong with these options, as a key the caller turns into a message.
 * Null when the search can run. Kept here rather than in the UI so the rules are
 * testable and stated once.
 */
export function validateOptions(o) {
  const opts = normaliseOptions(o);
  const badRor = opts.rors.find((r) => !ROR_RE.test(r));
  if (badRor) return { key: 'badRor', id: badRor };
  const badRinggold = opts.ringgolds.find((r) => !RINGGOLD_RE.test(r));
  if (badRinggold) return { key: 'badRinggold', id: badRinggold };
  const active = activeCriteria(opts);
  // A current/past search is name-only, so a user who set the status and gave
  // only an identifier is told exactly that rather than "no criteria".
  if (opts.affiliationStatus !== 'any' && !active.name)
    return { key: 'statusNeedsName' };
  if (!active.ror && !active.ringgold && !active.name) return { key: 'noCriteria' };
  if (opts.startFrom && opts.startTo && opts.startFrom > opts.startTo)
    return { key: 'badStartRange' };
  return null;
}

/** Do the active filters need the per-candidate employments call? */
export function needsEmployments(o) {
  const opts = normaliseOptions(o);
  return (
    opts.roleTitles.length > 0 ||
    opts.excludeRoleTitles.length > 0 ||
    opts.departments.length > 0 ||
    opts.countries.length > 0 ||
    opts.startFrom !== null ||
    opts.startTo !== null ||
    !!opts.requireStartDate ||
    !!opts.currentOnly ||
    !!opts.assertedOnly
  );
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

/**
 * Who put this employment on the record.
 *
 * ORCID records the writer of every item in `source`, and that is the difference
 * between a claim and a corroborated one:
 *
 *   'self'         the researcher's own iD is the source. Nothing outside the
 *                  record backs it.
 *   'organization' a member's system wrote it: the university, a funder, a
 *                  national aggregator. `assertionSource` names it.
 *   'other'        another person's iD wrote it, which ORCID allows through a
 *                  trusted-individual delegation.
 *   'unknown'      the employment carries no source at all. Every record the
 *                  live API returns carries one, so this is malformed input
 *                  rather than a real case, but calling it 'self' would be a
 *                  guess reported as a finding.
 *
 * `assertionOrigin` is what ORCID puts in `assertion-origin-*`: the party the
 * source names as having asked for the assertion, when that is not the source
 * itself. It is reported as it stands and nothing is inferred from it.
 */
export function classifyAssertion(emp, orcid) {
  const src = emp?.source ?? {};
  const clientId = src['source-client-id']?.path ?? null;
  const sourceOrcid = src['source-orcid']?.path ?? null;
  const assertionSource = src['source-name']?.value ?? null;
  const assertionOrigin = src['assertion-origin-name']?.value ?? null;
  if (clientId) return { assertedBy: 'organization', assertionSource, assertionOrigin };
  if (!sourceOrcid) return { assertedBy: 'unknown', assertionSource, assertionOrigin };
  if (sourceOrcid !== orcid) return { assertedBy: 'other', assertionSource, assertionOrigin };
  return { assertedBy: 'self', assertionSource, assertionOrigin };
}

/**
 * How far a candidate got through the employment filters. The number is what
 * attributes a rejection to the filter that actually caused it, so the order
 * here IS the order of the checks in `matchEmployments`: moving one without the
 * other turns every count in the breakdown into fiction.
 */
const STAGE = {
  NONE: 0, ORG: 1, COUNTRY: 2, DEPARTMENT: 3, ROLE: 4, ROLE_KEPT: 5,
  START_PRESENT: 6, START_IN_RANGE: 7, ASSERTED: 8, KEPT: 9,
};

/** The breakdown counter a candidate lands in, by the last stage it passed:
 *  a rejection belongs to the check that comes NEXT. */
const REJECTED_BY = {
  [STAGE.NONE]: 'noOrgMatch',
  [STAGE.ORG]: 'noCountryMatch',
  [STAGE.COUNTRY]: 'noDepartmentMatch',
  [STAGE.DEPARTMENT]: 'noRoleMatch',
  [STAGE.ROLE]: 'roleExcluded',
  [STAGE.ROLE_KEPT]: 'noStartDate',
  [STAGE.START_PRESENT]: 'startOutOfRange',
  [STAGE.START_IN_RANGE]: 'selfAsserted',
  [STAGE.ASSERTED]: 'pastEmployment',
};

/** Lower-cased needles, computed once per run rather than once per candidate. */
function needles(opts, extraNames = []) {
  const lower = (list) => list.map((x) => x.toLowerCase());
  return {
    rors: new Set(opts.rors),
    names: lower([...new Set([...opts.orgNames, ...extraNames])]),
    roles: lower(opts.roleTitles),
    excludeRoles: lower(opts.excludeRoleTitles),
    departments: lower(opts.departments),
    countries: new Set(opts.countries),
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
    // Fast mode never opens an employment, so who asserted it is not known.
    // Reporting 'self' here would be a guess dressed as a finding.
    assertedBy: null,
    assertionSource: null,
    assertionOrigin: null,
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
  const orcid = row['orcid-id'];
  let stage = STAGE.NONE;
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
      stage = Math.max(stage, STAGE.ORG);

      const address = org.address ?? {};
      const country = String(address.country ?? '').toUpperCase() || null;
      if (n.countries.size && !(country && n.countries.has(country))) continue;
      stage = Math.max(stage, STAGE.COUNTRY);

      const department = emp['department-name'] ?? null;
      if (n.departments.length) {
        const d = String(department ?? '').toLowerCase();
        if (!n.departments.some((needle) => d.includes(needle))) continue;
      }
      stage = Math.max(stage, STAGE.DEPARTMENT);

      const role = String(emp['role-title'] ?? '').toLowerCase();
      if (n.roles.length && !n.roles.some((rt) => role.includes(rt))) continue;
      stage = Math.max(stage, STAGE.ROLE);

      // ORCID's query language has no negation, so an exclusion can only be
      // applied here, against the record we already hold.
      if (n.excludeRoles.some((rt) => role.includes(rt))) continue;
      stage = Math.max(stage, STAGE.ROLE_KEPT);

      const start = emp['start-date'];
      const startYear = start?.year?.value ? parseInt(start.year.value, 10) : null;
      if (o.requireStartDate && startYear === null) continue;
      stage = Math.max(stage, STAGE.START_PRESENT);

      // A range implies a start date: an employment with no year cannot be
      // shown to fall inside it, so it is out of range rather than undated.
      if (o.startFrom !== null || o.startTo !== null) {
        if (startYear === null) continue;
        if (o.startFrom !== null && startYear < o.startFrom) continue;
        if (o.startTo !== null && startYear > o.startTo) continue;
      }
      stage = Math.max(stage, STAGE.START_IN_RANGE);

      const assertion = classifyAssertion(emp, orcid);
      if (o.assertedOnly && assertion.assertedBy !== 'organization') continue;
      stage = Math.max(stage, STAGE.ASSERTED);

      const end = emp['end-date'];
      if (o.currentOnly && hasEnded(end, today)) continue;

      return {
        stage: STAGE.KEPT,
        person: {
          orcid,
          name: nameOf(row),
          givenName: row['given-names'] ?? null,
          familyName: row['family-names'] ?? null,
          roleTitle: emp['role-title'] ?? null,
          department,
          organization: org.name ?? null,
          country,
          city: address.city ?? null,
          startDate: formatOrcidDate(start),
          endDate: formatOrcidDate(end),
          institutions: row['institution-name'] ?? [],
          matchedBy: 'employment',
          ...assertion,
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
    noCountryMatch: o.countries.length ? 0 : null,
    noDepartmentMatch: o.departments.length ? 0 : null,
    noRoleMatch: o.roleTitles.length ? 0 : null,
    roleExcluded: o.excludeRoleTitles.length ? 0 : null,
    noStartDate: o.requireStartDate ? 0 : null,
    startOutOfRange: o.startFrom !== null || o.startTo !== null ? 0 : null,
    selfAsserted: o.assertedOnly ? 0 : null,
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
  const breakdown = emptyBreakdown(o);
  const search = deps.search ?? ((q, max) => expandedSearch(q, max, deps));
  const employments = deps.employments ?? ((id) => fetchEmployments(id, deps));
  const resolveRorFacts = deps.resolveRorFacts ?? ((id) => fetchRorFacts(id, deps));
  const onProgress = deps.onProgress ?? (() => {});
  const concurrency = deps.concurrency ?? 6;
  const today = deps.today ?? new Date();
  const full = needsEmployments(o);
  const empty = { people: [], breakdown, totalFound: 0, scanned: 0, query: '', rorNames: [], gridIds: [], mode: 'fast', aborted: false };

  // ROR is resolved BEFORE the query is built, because it feeds two different
  // things and one of them is the query itself:
  //
  //   the GRID id  goes into the query. ORCID indexes ROR and GRID separately,
  //                so for Karolinska `ror-org-id` alone finds 4,206 accounts
  //                where `ror-org-id OR grid-org-id` finds 5,318.
  //   the names    go into the employment match. ORCID lets an employment be
  //                disambiguated with RINGGOLD or FUNDREF instead of ROR, so
  //                matching on the ROR id alone drops exactly the employments
  //                an institution's own system asserts.
  //
  // One request per ROR id, and none at all when no ROR criterion is in play.
  const wantsRor = o.byRor && o.rors.length > 0 && o.affiliationStatus === 'any';
  const facts = wantsRor ? await Promise.all(o.rors.map(resolveRorFacts)) : [];
  const gridIds = [...new Set(facts.map((f) => f?.grid).filter(Boolean))];
  // The names are only ever compared against an employment, so in fast mode
  // they are neither used nor reported.
  const rorNames = full ? [...new Set(facts.flatMap((f) => f?.names ?? []))] : [];

  const query = buildQuery(o, { gridIds });
  if (!query) return empty;

  const n = needles(o, rorNames);
  onProgress({ phase: 'search', done: 0, total: o.maxRows });
  const { rows, totalFound } = await search(query, o.maxRows);
  const base = { breakdown, totalFound, scanned: rows.length, query, rorNames, gridIds, mode: full ? 'full' : 'fast' };

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
      if (res.person) { people.push(res.person); continue; }
      if (res.stage === -1) { breakdown.unreachable++; continue; }
      // The counter this lands on is always an active one, and that is a
      // property of the chain rather than luck: a check that is switched off
      // still advances the stage, so the stage a candidate stops at is always
      // the one immediately before the check that rejected it. Searching
      // forward for an active counter was written here first and turned out to
      // be unreachable, which an injected defect proved by changing nothing.
      const key = REJECTED_BY[res.stage] ?? 'noOrgMatch';
      breakdown[key] = (breakdown[key] ?? 0) + 1;
    }
    done += batch.length;
    onProgress({ phase: 'employments', done, total: rows.length });
  }
  onProgress({ phase: 'done', done, total: rows.length });
  return { ...base, people, aborted: false };
}
