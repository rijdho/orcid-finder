// The discovery filters, with exact expected values. Every HTTP call is injected,
// so these tests are about the logic and cannot be broken by ORCID's data
// changing under them.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  buildQuery, isValidRor, normaliseRor, parseList, needsEmployments, activeCriteria,
  matchSearchRow, matchEmployments, hasEnded, formatOrcidDate, discoverPeople, normaliseOptions,
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

const emp = ({ name = 'Institute of Digital Sciences Austria', ror = null, role = null, dept = null, start = null, end = null } = {}) => ({
  organization: {
    name,
    ...(ror ? { 'disambiguated-organization': { 'disambiguated-organization-identifier': ror } } : {}),
  },
  'role-title': role,
  'department-name': dept,
  'start-date': start,
  'end-date': end,
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
  assert.deepEqual(activeCriteria({ rors: [], orgNames: ['IT:U'] }), { ror: false, name: true });
});

test('normaliseOptions clamps maxRows into the ORCID paging range', () => {
  assert.equal(normaliseOptions({ maxRows: 0 }).maxRows, 200, 'a falsy value falls back to the default');
  assert.equal(normaliseOptions({ maxRows: 5000 }).maxRows, 1000);
  assert.equal(normaliseOptions({ maxRows: '50' }).maxRows, 50);
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

test('full mode matches an employment by ROR id and reports its fields', () => {
  const doc = employments(emp({ name: 'Differently Worded', ror: 'https://ror.org/03yrm5c26', role: 'Professor', dept: 'CS', start: date(2024, 9, 1) }));
  const { stage, person } = matchEmployments(doc, row('0000-0001-0000-0007'), OPTS, TODAY);
  assert.equal(stage, 4);
  assert.equal(person.roleTitle, 'Professor');
  assert.equal(person.department, 'CS');
  assert.equal(person.startDate, '2024-09-01');
  assert.equal(person.matchedBy, 'employment');
});

test('full mode rejects at the stage the filter actually applies', () => {
  const r = row('0000-0001-0000-0008');
  const elsewhere = employments(emp({ name: 'Unrelated University' }));
  assert.equal(matchEmployments(elsewhere, r, { ...OPTS, roleTitles: ['professor'] }, TODAY).stage, 0);

  const wrongRole = employments(emp({ role: 'Administrator' }));
  assert.equal(matchEmployments(wrongRole, r, { ...OPTS, roleTitles: ['professor'] }, TODAY).stage, 1);

  const noStart = employments(emp({ role: 'Professor' }));
  assert.equal(matchEmployments(noStart, r, { ...OPTS, roleTitles: ['professor'], requireStartDate: true }, TODAY).stage, 2);

  const ended = employments(emp({ role: 'Professor', start: date(2019, 1), end: date(2021, 6) }));
  assert.equal(matchEmployments(ended, r, { ...OPTS, roleTitles: ['professor'], requireStartDate: true, currentOnly: true }, TODAY).stage, 3);
});

test('full mode matches role titles case-insensitively, as a substring', () => {
  const doc = employments(emp({ role: 'Assistant Professor of Computer Science' }));
  assert.equal(matchEmployments(doc, row('0000-0001-0000-0009'), { ...OPTS, roleTitles: ['PROFESSOR'] }, TODAY).stage, 4);
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
    { search: async () => ({ rows, totalFound: 5 }), employments: async (id) => byId[id], today: TODAY, concurrency: 2 },
  );

  assert.equal(r.mode, 'full');
  assert.equal(r.people.length, 1);
  assert.equal(r.people[0].orcid, '0000-0001-0000-0030');
  assert.deepEqual(r.breakdown, {
    noOrgMatch: 1, noRoleMatch: 1, noStartDate: 1, pastEmployment: 1, unreachable: 0,
  });
});

test('an unreadable record is counted apart from a filter verdict', async () => {
  const rows = [row('0000-0001-0000-0041')];
  const r = await discoverPeople(
    { ...OPTS, roleTitles: ['professor'] },
    { search: async () => ({ rows, totalFound: 1 }), employments: async () => null },
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
