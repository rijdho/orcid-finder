// The discovery filters, with exact expected values. Every HTTP call is injected,
// so these tests are about the logic and cannot be broken by ORCID's data
// changing under them.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  buildQuery, isValidRor, normaliseRor, parseList, needsEmployments, activeCriteria,
  matchSearchRow, matchEmployments, hasEnded, formatOrcidDate, discoverPeople, normaliseOptions,
  classifyAssertion, validateOptions, clampMaxRows, MAX_ROWS,
} from '../src/discover.js';
import { expandedSearch } from '../src/orcid.js';

// ── fixtures ────────────────────────────────────────────────────────────────

const row = (id, names = [], given = 'Ada', family = 'Lovelace') => ({
  'orcid-id': id,
  'given-names': given,
  'family-names': family,
  'institution-name': names,
});

const date = (y, m, d) => (y == null ? null : {
  year: { value: String(y) },
  ...(m ? { month: { value: String(m).padStart(2, '0') } } : {}),
  ...(d ? { day: { value: String(d).padStart(2, '0') } } : {}),
});

/** One employments document with a single summary. */
const employments = (...summaries) => ({
  'affiliation-group': summaries.map((s) => ({ summaries: [{ 'employment-summary': s }] })),
});

const emp = ({ name = 'Institute of Digital Sciences Austria', ror = null, role = null, dept = null, start = null, end = null, source = null, country = null, city = null } = {}) => ({
  organization: {
    name,
    ...(ror ? { 'disambiguated-organization': { 'disambiguated-organization-identifier': ror } } : {}),
    ...(country || city ? { address: { country, city } } : {}),
  },
  'role-title': role,
  'department-name': dept,
  'start-date': start,
  'end-date': end,
  ...(source ? { source } : {}),
});

/** A self-asserted source: the record's own iD wrote the entry. */
const selfSource = (orcid, who = 'Ada Lovelace') => ({
  'source-orcid': { path: orcid },
  'source-name': { value: who },
  'source-client-id': null,
});

/** A member organisation's system wrote the entry. Both client-id shapes ORCID
 *  issues are seen in the wild: an ORCID-format id and an APP- prefixed one. */
const orgSource = (client = 'APP-4HOGAF1S1G7KC47J', who = 'TU Wien', origin = null) => ({
  'source-orcid': null,
  'source-client-id': { path: client },
  'source-name': { value: who },
  ...(origin ? { 'assertion-origin-name': { value: origin } } : {}),
});

// ── ROR ids ─────────────────────────────────────────────────────────────────

test('normaliseRor strips the resolver prefix and case', () => {
  assert.equal(normaliseRor('https://ror.org/03YRM5C26'), '03yrm5c26');
  assert.equal(normaliseRor('  03yrm5c26 '), '03yrm5c26');
  assert.equal(normaliseRor(null), '');
});

test('isValidRor accepts the ROR shape and rejects near-misses', () => {
  assert.equal(isValidRor('03yrm5c26'), true);
  assert.equal(isValidRor('https://ror.org/03yrm5c26'), true);
  // ROR excludes i, l, o and u to keep ids unambiguous when read aloud.
  assert.equal(isValidRor('03yrm5cio'), false);
  assert.equal(isValidRor('13yrm5c26'), false, 'must start with 0');
  assert.equal(isValidRor('03yrm5c2'), false, 'nine characters, not eight');
  assert.equal(isValidRor(''), false);
});

test('parseList splits, trims and de-duplicates', () => {
  assert.deepEqual(parseList(' a, b ,, a '), ['a', 'b']);
  assert.deepEqual(parseList(''), []);
  assert.deepEqual(parseList(null), []);
});

// ── query building ──────────────────────────────────────────────────────────

test('buildQuery ORs every active criterion, one term each', () => {
  const q = buildQuery({ rors: ['03yrm5c26', 'https://ror.org/05gq02987'], orgNames: ['IT:U'] });
  assert.equal(
    q,
    'ror-org-id:"https://ror.org/03yrm5c26" OR ror-org-id:"https://ror.org/05gq02987" OR affiliation-org-name:"IT:U"',
  );
});

test('buildQuery honours the two criterion switches', () => {
  const base = { rors: ['03yrm5c26'], orgNames: ['IT:U'] };
  assert.equal(buildQuery({ ...base, byName: false }), 'ror-org-id:"https://ror.org/03yrm5c26"');
  assert.equal(buildQuery({ ...base, byRor: false }), 'affiliation-org-name:"IT:U"');
  assert.equal(buildQuery({ ...base, byRor: false, byName: false }), null);
});

test('buildQuery returns null when a ticked box has an empty field', () => {
  assert.equal(buildQuery({ rors: [], orgNames: [], byRor: true, byName: true }), null);
  assert.deepEqual(activeCriteria({ rors: [], orgNames: ['IT:U'] }), { ror: false, ringgold: false, name: true });
});

test('normaliseOptions clamps maxRows into the ORCID paging range', () => {
  assert.equal(normaliseOptions({ maxRows: 0 }).maxRows, 200, 'a falsy value falls back to the default');
  assert.equal(normaliseOptions({ maxRows: 5000 }).maxRows, 2000);
  assert.equal(normaliseOptions({ maxRows: '50' }).maxRows, 50);
});

test('clampMaxRows takes anything a form or a URL can hand it', () => {
  // A URL parameter skips the input's own min/max, so this is the only guard
  // between `?max=999999` and a run that asks ORCID for it.
  assert.equal(clampMaxRows('5000'), MAX_ROWS);
  assert.equal(clampMaxRows(MAX_ROWS + 1), MAX_ROWS);
  assert.equal(clampMaxRows(String(MAX_ROWS)), MAX_ROWS, 'the ceiling itself is allowed');
  assert.equal(clampMaxRows('-40'), 1, 'below the floor becomes the floor, never a negative page size');
  assert.equal(clampMaxRows(null), 200, 'an absent parameter is the default, not NaN');
  assert.equal(clampMaxRows(undefined), 200);
  assert.equal(clampMaxRows('abc'), 200, 'an unparseable value is the default, not NaN');
  assert.equal(clampMaxRows('1200'), 1200, 'a value past the old 1000 limit survives');
});

test('needsEmployments is true for exactly the three employment filters', () => {
  assert.equal(needsEmployments({ rors: ['03yrm5c26'] }), false);
  assert.equal(needsEmployments({ roleTitles: ['professor'] }), true);
  assert.equal(needsEmployments({ requireStartDate: true }), true);
  assert.equal(needsEmployments({ currentOnly: true }), true);
});

// ── dates ───────────────────────────────────────────────────────────────────

test('formatOrcidDate renders the most precise ISO prefix available', () => {
  assert.equal(formatOrcidDate(date(2024, 3, 7)), '2024-03-07');
  assert.equal(formatOrcidDate(date(2024, 3)), '2024-03');
  assert.equal(formatOrcidDate(date(2024)), '2024');
  assert.equal(formatOrcidDate(null), null);
  assert.equal(formatOrcidDate({ month: { value: '03' } }), null, 'a month without a year is not a date');
});

test('a partial end date counts as current until its latest possible instant', () => {
  const midYear = new Date('2026-06-15');
  assert.equal(hasEnded(date(2026), midYear), false, 'ended "2026" is still current in June 2026');
  assert.equal(hasEnded(date(2025), midYear), true);
  assert.equal(hasEnded(date(2026, 5), midYear), true, 'ended May 2026 has passed by 15 June');
  assert.equal(hasEnded(null, midYear), false, 'no end date means the appointment runs on');
});

// ── fast mode ───────────────────────────────────────────────────────────────

test('fast mode keeps a name match and labels it', () => {
  const p = matchSearchRow(row('0000-0001-0000-0001', ['Interdisciplinary Transformation University Austria']),
    { orgNames: ['transformation university'], byRor: false });
  assert.equal(p.matchedBy, 'name');
  assert.equal(p.name, 'Ada Lovelace');
  assert.equal(p.organization, 'Interdisciplinary Transformation University Austria');
});

test('fast mode trusts a ROR match whose institution name reads differently', () => {
  const opts = { rors: ['03yrm5c26'], orgNames: ['IT:U'] };
  const p = matchSearchRow(row('0000-0001-0000-0002', ['Some Other Spelling']), opts);
  assert.equal(p.matchedBy, 'ror_only', 'the ROR criterion is why the row is here at all');
});

test('fast mode drops a non-matching name when ROR is not a criterion', () => {
  const p = matchSearchRow(row('0000-0001-0000-0003', ['Some Other Spelling']),
    { orgNames: ['IT:U'], byRor: false });
  assert.equal(p, null);
});

test('fast mode keeps a row that carries no institution name at all', () => {
  // ORCID indexes some accounts without institution-name[]; with nothing to
  // contradict the query, the search hit is the only evidence there is.
  const p = matchSearchRow(row('0000-0001-0000-0004', []), { orgNames: ['IT:U'], byRor: false });
  assert.equal(p.matchedBy, 'ror_only');
});

test('fast mode falls back to the credit name, then to the iD', () => {
  const credit = { 'orcid-id': '0000-0001-0000-0005', 'credit-name': 'A. Lovelace', 'institution-name': [] };
  assert.equal(matchSearchRow(credit, { orgNames: ['x'], byRor: false }).name, 'A. Lovelace');
  const bare = { 'orcid-id': '0000-0001-0000-0006', 'institution-name': [] };
  assert.equal(matchSearchRow(bare, { orgNames: ['x'], byRor: false }).name, '0000-0001-0000-0006');
});

// ── full mode ───────────────────────────────────────────────────────────────

const OPTS = { rors: ['03yrm5c26'], orgNames: ['institute of digital sciences'] };
const TODAY = new Date('2026-06-15');
/** No ROR lookup. Every test in this file injects it: a suite that reaches the
 *  network is not testing the logic, it is testing today's registry. */
const NO_ROR = async () => ({ names: [], grid: null });

test('full mode matches an employment by ROR id and reports its fields', () => {
  const doc = employments(emp({ name: 'Differently Worded', ror: 'https://ror.org/03yrm5c26', role: 'Professor', dept: 'CS', start: date(2024, 9, 1) }));
  const { stage, person } = matchEmployments(doc, row('0000-0001-0000-0007'), OPTS, TODAY);
  assert.equal(stage, 9, 'a kept candidate has passed every stage');
  assert.equal(person.roleTitle, 'Professor');
  assert.equal(person.department, 'CS');
  assert.equal(person.startDate, '2024-09-01');
  assert.equal(person.matchedBy, 'employment');
});

test('full mode rejects at the stage the filter actually applies', () => {
  const r = row('0000-0001-0000-0008');
  // The stage is the last check the candidate PASSED, and a check that is not
  // configured still counts as passed, so these numbers move when the chain
  // gains a step. That is deliberate: the numbers are the chain's order.
  const elsewhere = employments(emp({ name: 'Unrelated University' }));
  assert.equal(matchEmployments(elsewhere, r, { ...OPTS, roleTitles: ['professor'] }, TODAY).stage, 0);

  const wrongCountry = employments(emp({ country: 'AT' }));
  assert.equal(matchEmployments(wrongCountry, r, { ...OPTS, countries: ['SE'] }, TODAY).stage, 1);

  const wrongDept = employments(emp({ dept: 'Physics' }));
  assert.equal(matchEmployments(wrongDept, r, { ...OPTS, departments: ['chemistry'] }, TODAY).stage, 2);

  const wrongRole = employments(emp({ role: 'Administrator' }));
  assert.equal(matchEmployments(wrongRole, r, { ...OPTS, roleTitles: ['professor'] }, TODAY).stage, 3);

  const excluded = employments(emp({ role: 'PhD Student' }));
  assert.equal(matchEmployments(excluded, r, { ...OPTS, excludeRoleTitles: ['phd'] }, TODAY).stage, 4);

  const noStart = employments(emp({ role: 'Professor' }));
  assert.equal(matchEmployments(noStart, r, { ...OPTS, roleTitles: ['professor'], requireStartDate: true }, TODAY).stage, 5);

  const tooEarly = employments(emp({ role: 'Professor', start: date(2001, 1) }));
  assert.equal(matchEmployments(tooEarly, r, { ...OPTS, startFrom: 2020 }, TODAY).stage, 6);

  const selfOnly = employments(emp({ role: 'Professor', start: date(2019, 1), source: selfSource(r['orcid-id']) }));
  assert.equal(matchEmployments(selfOnly, r, { ...OPTS, roleTitles: ['professor'], requireStartDate: true, assertedOnly: true }, TODAY).stage, 7);

  const ended = employments(emp({ role: 'Professor', start: date(2019, 1), end: date(2021, 6) }));
  assert.equal(matchEmployments(ended, r, { ...OPTS, roleTitles: ['professor'], requireStartDate: true, currentOnly: true }, TODAY).stage, 8);
});

test('full mode matches role titles case-insensitively, as a substring', () => {
  const doc = employments(emp({ role: 'Assistant Professor of Computer Science' }));
  assert.equal(matchEmployments(doc, row('0000-0001-0000-0009'), { ...OPTS, roleTitles: ['PROFESSOR'] }, TODAY).stage, 9);
});

test('full mode takes the first employment that passes, not the first that matches us', () => {
  const doc = employments(
    emp({ role: 'PhD Student', start: date(2018, 1), end: date(2022, 1) }),
    emp({ role: 'Professor', start: date(2022, 2) }),
  );
  const { person } = matchEmployments(doc, row('0000-0001-0000-0010'), { ...OPTS, roleTitles: ['professor'], currentOnly: true }, TODAY);
  assert.equal(person.roleTitle, 'Professor');
  assert.equal(person.startDate, '2022-02');
});

test('full mode reports the end date when there is one', () => {
  const doc = employments(emp({ role: 'Professor', start: date(2020), end: date(2030) }));
  const { person } = matchEmployments(doc, row('0000-0001-0000-0011'), { ...OPTS, currentOnly: true }, TODAY);
  assert.equal(person.endDate, '2030');
});

// ── the whole run ───────────────────────────────────────────────────────────

test('a run with no criterion returns nothing and asks no questions of ORCID', async () => {
  let called = false;
  const r = await discoverPeople({}, { search: () => { called = true; } });
  assert.equal(called, false);
  assert.deepEqual(r.people, []);
  assert.equal(r.query, '');
});

test('fast run: keeps the matches, counts the rest as no affiliation match', async () => {
  const rows = [
    row('0000-0001-0000-0021', ['Institute of Digital Sciences Austria']),
    row('0000-0001-0000-0022', ['Unrelated University']),
    row('0000-0001-0000-0023', ['institute of digital sciences austria']),
  ];
  const r = await discoverPeople(
    { orgNames: ['Institute of Digital Sciences'], byRor: false },
    { search: async () => ({ rows, totalFound: 3 }) },
  );
  assert.equal(r.mode, 'fast');
  assert.equal(r.people.length, 2);
  assert.equal(r.breakdown.noOrgMatch, 1);
  assert.equal(r.breakdown.noRoleMatch, null, 'a filter that was not applied reports null, not zero');
  assert.equal(r.scanned, 3);
  assert.equal(r.totalFound, 3);
});

test('full run: the breakdown attributes every rejection to one filter', async () => {
  const docs = {
    a: employments(emp({ role: 'Professor', start: date(2023, 10, 1) })),                    // kept
    b: employments(emp({ name: 'Unrelated University', role: 'Professor' })),                // no org
    c: employments(emp({ role: 'Administrator' })),                                          // no role
    d: employments(emp({ role: 'Professor' })),                                              // no start date
    e: employments(emp({ role: 'Professor', start: date(2015), end: date(2019) })),           // ended
  };
  const rows = Object.keys(docs).map((k, i) => row(`0000-0001-0000-003${i}`, [], k, 'X'));
  const byId = Object.fromEntries(rows.map((rw, i) => [rw['orcid-id'], docs[Object.keys(docs)[i]]]));

  const r = await discoverPeople(
    { ...OPTS, roleTitles: ['professor'], requireStartDate: true, currentOnly: true },
    { search: async () => ({ rows, totalFound: 5 }), employments: async (id) => byId[id], today: TODAY, concurrency: 2, resolveRorFacts: NO_ROR },
  );

  assert.equal(r.mode, 'full');
  assert.equal(r.people.length, 1);
  assert.equal(r.people[0].orcid, '0000-0001-0000-0030');
  assert.deepEqual(r.breakdown, {
    noOrgMatch: 1, noCountryMatch: null, noDepartmentMatch: null, noRoleMatch: 1, roleExcluded: null,
    noStartDate: 1, startOutOfRange: null, selfAsserted: null, pastEmployment: 1, unreachable: 0,
  });
});

test('an unreadable record is counted apart from a filter verdict', async () => {
  const rows = [row('0000-0001-0000-0041')];
  const r = await discoverPeople(
    { ...OPTS, roleTitles: ['professor'] },
    { search: async () => ({ rows, totalFound: 1 }), employments: async () => null, resolveRorFacts: NO_ROR },
  );
  assert.equal(r.breakdown.unreachable, 1);
  assert.equal(r.breakdown.noOrgMatch, 0, 'a network failure is not "this person does not work here"');
});

test('cancelling mid-run keeps what was already examined', async () => {
  const rows = Array.from({ length: 10 }, (_, i) => row(`0000-0001-0000-01${String(i).padStart(2, '0')}`));
  const ctrl = new AbortController();
  let seen = 0;
  const r = await discoverPeople(
    { ...OPTS, roleTitles: ['professor'] },
    {
      search: async () => ({ rows, totalFound: 10 }),
      employments: async () => {
        if (++seen >= 2) ctrl.abort();
        return employments(emp({ role: 'Professor' }));
      },
      signal: ctrl.signal,
      concurrency: 2,
      resolveRorFacts: NO_ROR,
    },
  );
  assert.equal(r.aborted, true);
  assert.equal(r.people.length, 2, 'the batch in flight when Cancel was pressed still counts');
  assert.equal(r.scanned, 2);
});

test('progress is reported per batch, not per record', async () => {
  const rows = Array.from({ length: 5 }, (_, i) => row(`0000-0001-0000-02${i}0`));
  const seen = [];
  await discoverPeople(
    { ...OPTS, currentOnly: true },
    {
      search: async () => ({ rows, totalFound: 5 }),
      employments: async () => employments(emp({})),
      concurrency: 2,
      resolveRorFacts: NO_ROR,
      onProgress: (p) => seen.push(`${p.phase}:${p.done}/${p.total}`),
    },
  );
  assert.deepEqual(seen, ['search:0/200', 'employments:2/5', 'employments:4/5', 'employments:5/5', 'done:5/5']);
});

// ── paging ──────────────────────────────────────────────────────────────────

test('expandedSearch pages until ORCID runs out and never exceeds the cap', async () => {
  const urls = [];
  const page = (n, start) => ({
    'num-found': 150,
    'expanded-result': Array.from({ length: n }, (_, i) => row(`0000-0002-0000-${String(start + i).padStart(4, '0')}`)),
  });
  const get = async (url) => {
    urls.push(url);
    return urls.length === 1 ? page(100, 0) : page(50, 100);
  };
  const { rows, totalFound } = await expandedSearch('ror-org-id:"x"', 200, { get });
  assert.equal(rows.length, 150);
  assert.equal(totalFound, 150);
  assert.equal(urls.length, 2);
  assert.match(urls[1], /start=100/);
});

test('expandedSearch stops at the cap even when more pages exist', async () => {
  const get = async () => ({
    'num-found': 1000,
    'expanded-result': Array.from({ length: 100 }, (_, i) => row(`0000-0003-0000-${String(i).padStart(4, '0')}`)),
  });
  const { rows } = await expandedSearch('q', 120, { get });
  assert.equal(rows.length, 120);
});

test('expandedSearch gives up quietly when the endpoint cannot be read', async () => {
  const { rows, totalFound } = await expandedSearch('q', 100, { get: async () => null });
  assert.deepEqual(rows, []);
  assert.equal(totalFound, 0);
});

// ── who asserted the employment ─────────────────────────────────────────────

test('an employment whose source is the record itself is self-asserted', () => {
  const id = '0000-0001-0000-0050';
  const a = classifyAssertion(emp({ source: selfSource(id) }), id);
  assert.equal(a.assertedBy, 'self');
  assert.equal(a.assertionSource, 'Ada Lovelace');
  assert.equal(a.assertionOrigin, null);
});

test('an employment written by a member client is organisation-asserted', () => {
  const a = classifyAssertion(emp({ source: orgSource() }), '0000-0001-0000-0051');
  assert.equal(a.assertedBy, 'organization');
  assert.equal(a.assertionSource, 'TU Wien', 'the asserting body is named, not just flagged');
});

test('a client id in ORCID-iD form is still a client, not a person', () => {
  // Karolinska Institutet's live client id has the shape of an ORCID iD; only
  // the FIELD it sits in says whether a person or a system wrote the entry.
  const a = classifyAssertion(emp({ source: orgSource('0000-0002-7539-5209', 'Karolinska Institutet') }), '0000-0001-0000-0052');
  assert.equal(a.assertedBy, 'organization');
  assert.equal(a.assertionSource, 'Karolinska Institutet');
});

test('a different person\'s iD as source is neither self nor organisation', () => {
  const a = classifyAssertion(emp({ source: selfSource('0000-0009-9999-9999', 'A Trusted Colleague') }), '0000-0001-0000-0053');
  assert.equal(a.assertedBy, 'other');
});

test('an employment with no source at all is unknown, never self', () => {
  // Calling it self-asserted would report a guess as a finding.
  const a = classifyAssertion(emp({}), '0000-0001-0000-0054');
  assert.equal(a.assertedBy, 'unknown');
  assert.equal(a.assertionSource, null);
});

test('the assertion origin is carried through when the source names one', () => {
  const a = classifyAssertion(emp({ source: orgSource('APP-X', 'TU Wien', 'Ada Lovelace') }), '0000-0001-0000-0055');
  assert.equal(a.assertedBy, 'organization');
  assert.equal(a.assertionOrigin, 'Ada Lovelace');
});

test('a kept candidate carries the assertion onto the row', () => {
  const r = row('0000-0001-0000-0056');
  const doc = employments(emp({ role: 'Professor', source: orgSource('APP-X', 'Institute of Digital Sciences Austria') }));
  const { person } = matchEmployments(doc, r, OPTS, TODAY);
  assert.equal(person.assertedBy, 'organization');
  assert.equal(person.assertionSource, 'Institute of Digital Sciences Austria');
});

test('assertedOnly keeps the organisation-asserted employment and drops the rest', () => {
  const opts = { ...OPTS, assertedOnly: true };
  const r1 = row('0000-0001-0000-0060');
  const selfDoc = employments(emp({ role: 'Professor', source: selfSource(r1['orcid-id']) }));
  assert.equal(matchEmployments(selfDoc, r1, opts, TODAY).person, null);

  const r2 = row('0000-0001-0000-0061');
  const orgDoc = employments(emp({ role: 'Professor', source: orgSource() }));
  assert.equal(matchEmployments(orgDoc, r2, opts, TODAY).person.assertedBy, 'organization');
});

test('assertedOnly picks the asserted employment over an earlier self-asserted one', () => {
  const r = row('0000-0001-0000-0062');
  const doc = employments(
    emp({ role: 'Guest', source: selfSource(r['orcid-id']) }),
    emp({ role: 'Professor', source: orgSource() }),
  );
  const { person } = matchEmployments(doc, r, { ...OPTS, assertedOnly: true }, TODAY);
  assert.equal(person.roleTitle, 'Professor');
});

test('fast mode reports no assertion at all, rather than guessing self', () => {
  const p = matchSearchRow(row('0000-0001-0000-0063', ['Institute of Digital Sciences Austria']),
    { orgNames: ['institute of digital sciences'], byRor: false });
  assert.equal(p.assertedBy, null, 'null means the employment was never opened');
});

test('assertedOnly is one of the filters that force full mode', () => {
  assert.equal(needsEmployments({ assertedOnly: true }), true);
});

test('the self-asserted drop is counted under its own filter', () => {
  const rows = [row('0000-0001-0000-0070'), row('0000-0001-0000-0071')];
  const docs = {
    '0000-0001-0000-0070': employments(emp({ role: 'Professor', source: orgSource() })),
    '0000-0001-0000-0071': employments(emp({ role: 'Professor', source: selfSource('0000-0001-0000-0071') })),
  };
  return discoverPeople(
    { ...OPTS, roleTitles: ['professor'], assertedOnly: true },
    { search: async () => ({ rows, totalFound: 2 }), employments: async (id) => docs[id], today: TODAY, resolveRorFacts: NO_ROR },
  ).then((r) => {
    assert.equal(r.people.length, 1);
    assert.equal(r.breakdown.selfAsserted, 1);
    assert.equal(r.breakdown.noRoleMatch, 0, 'the role filter ran and dropped nobody');
    assert.equal(r.breakdown.pastEmployment, null, 'the current-appointment filter was not applied');
  });
});

// ── keywords, affiliation status and the identifier schemes ─────────────────

test('keywords are AND-ed onto the affiliation block, not OR-ed into it', () => {
  // OR-ing them would widen the search to everyone with the keyword anywhere in
  // ORCID, which is the opposite of narrowing an institution.
  const q = buildQuery({ rors: ['056d84691'], byName: false, keywords: ['epidemiology', 'oncology'] });
  assert.equal(
    q,
    '(ror-org-id:"https://ror.org/056d84691") AND (keyword:"epidemiology" OR keyword:"oncology")',
  );
});

test('a Ringgold id is its own criterion, independent of the ROR switch', () => {
  const q = buildQuery({ rors: ['056d84691'], ringgolds: ['27106'], byRor: false, byName: false });
  assert.equal(q, 'ringgold-org-id:"27106"', 'unticking ROR must not silently drop Ringgold too');
});

test('a Ringgold id must be a bare number', () => {
  assert.deepEqual(validateOptions({ ringgolds: ['27106'] }), null);
  assert.deepEqual(validateOptions({ ringgolds: ['grid.4714.6'] }), { key: 'badRinggold', id: 'grid.4714.6' });
});

test('the affiliation status switches which name field is queried', () => {
  const base = { rors: [], orgNames: ['Karolinska Institutet'] };
  assert.match(buildQuery({ ...base }), /^affiliation-org-name:/);
  assert.match(buildQuery({ ...base, affiliationStatus: 'current' }), /^current-institution-affiliation-name:/);
  assert.match(buildQuery({ ...base, affiliationStatus: 'past' }), /^past-institution-affiliation-name:/);
  assert.match(buildQuery({ ...base, affiliationStatus: 'nonsense' }), /^affiliation-org-name:/, 'an unknown status falls back to any');
});

test('a current or past search drops the identifier criteria, and says why', () => {
  // ORCID indexes current and past only on the name fields. Leaving the ROR
  // term in would return current staff in a search for former ones.
  const q = buildQuery({ rors: ['056d84691'], orgNames: ['Karolinska Institutet'], affiliationStatus: 'past' },
    { gridIds: ['grid.4714.6'] });
  assert.equal(q, 'past-institution-affiliation-name:"Karolinska Institutet"');
  assert.deepEqual(
    validateOptions({ rors: ['056d84691'], byName: false, affiliationStatus: 'past' }),
    { key: 'statusNeedsName' },
  );
});

test('a start range the wrong way round is refused rather than returning nothing', () => {
  assert.deepEqual(validateOptions({ rors: ['056d84691'], startFrom: 2025, startTo: 2020 }), { key: 'badStartRange' });
  assert.equal(validateOptions({ rors: ['056d84691'], startFrom: 2020, startTo: 2025 }), null);
});

// ── the filters that read the employment record ─────────────────────────────

test('the country filter compares the employment address, case-insensitively', () => {
  const r = row('0000-0001-0000-0080');
  const se = employments(emp({ country: 'SE', city: 'Stockholm' }));
  const at = employments(emp({ country: 'AT' }));
  assert.equal(matchEmployments(se, r, { ...OPTS, countries: ['se'] }, TODAY).person.country, 'SE');
  assert.equal(matchEmployments(at, r, { ...OPTS, countries: ['SE'] }, TODAY).person, null);
  // An employment with no address cannot be shown to be in the country asked for.
  assert.equal(matchEmployments(employments(emp({})), r, { ...OPTS, countries: ['SE'] }, TODAY).person, null);
});

test('the city travels onto the row even when nothing filters on it', () => {
  const { person } = matchEmployments(employments(emp({ country: 'SE', city: 'Stockholm' })), row('0000-0001-0000-0081'), OPTS, TODAY);
  assert.equal(person.city, 'Stockholm');
});

test('the department filter is a substring, like the role title', () => {
  const r = row('0000-0001-0000-0082');
  const doc = employments(emp({ dept: 'Department of Molecular Medicine and Surgery' }));
  assert.ok(matchEmployments(doc, r, { ...OPTS, departments: ['molecular medicine'] }, TODAY).person);
  assert.equal(matchEmployments(doc, r, { ...OPTS, departments: ['physics'] }, TODAY).person, null);
});

test('an excluded role title drops the employment even when it was included', () => {
  // ORCID's query language has no negation, so this can only happen here.
  const r = row('0000-0001-0000-0083');
  const doc = employments(emp({ role: 'Visiting PhD Student' }));
  assert.ok(matchEmployments(doc, r, { ...OPTS, roleTitles: ['student'] }, TODAY).person);
  assert.equal(matchEmployments(doc, r, { ...OPTS, roleTitles: ['student'], excludeRoleTitles: ['phd'] }, TODAY).person, null);
});

test('the start range is inclusive at both ends', () => {
  const r = row('0000-0001-0000-0084');
  const at = (y) => employments(emp({ start: date(y) }));
  const opts = { ...OPTS, startFrom: 2020, startTo: 2024 };
  assert.ok(matchEmployments(at(2020), r, opts, TODAY).person, '2020 is inside [2020, 2024]');
  assert.ok(matchEmployments(at(2024), r, opts, TODAY).person, '2024 is inside [2020, 2024]');
  assert.equal(matchEmployments(at(2019), r, opts, TODAY).person, null);
  assert.equal(matchEmployments(at(2025), r, opts, TODAY).person, null);
});

test('an open-ended range constrains only the end it names', () => {
  const r = row('0000-0001-0000-0085');
  assert.ok(matchEmployments(employments(emp({ start: date(2030) })), r, { ...OPTS, startFrom: 2020 }, TODAY).person);
  assert.ok(matchEmployments(employments(emp({ start: date(1990) })), r, { ...OPTS, startTo: 2020 }, TODAY).person);
});

test('an employment with no year cannot satisfy a range', () => {
  const { person } = matchEmployments(employments(emp({})), row('0000-0001-0000-0086'), { ...OPTS, startFrom: 2020 }, TODAY);
  assert.equal(person, null);
});

test('a rejection lands on the next ACTIVE filter, not on an unused counter', () => {
  // With country and department off, an employment that fails the role check
  // must be counted under the role filter rather than vanishing into a null.
  const rows = [row('0000-0001-0000-0087')];
  return discoverPeople(
    { ...OPTS, roleTitles: ['professor'] },
    {
      search: async () => ({ rows, totalFound: 1 }),
      employments: async () => employments(emp({ role: 'Administrator' })),
      today: TODAY,
      resolveRorFacts: NO_ROR,
    },
  ).then((r) => {
    assert.equal(r.breakdown.noRoleMatch, 1);
    assert.equal(r.breakdown.noCountryMatch, null);
    assert.equal(r.breakdown.noDepartmentMatch, null);
    assert.equal(r.breakdown.noOrgMatch, 0, 'the affiliation matched, so this must stay zero');
  });
});
