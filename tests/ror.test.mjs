// ROR name resolution. It exists to fix a real defect, so the tests are written
// against that defect: an employment an institution asserts about itself is
// often disambiguated with RINGGOLD rather than ROR, and matching on the ROR id
// alone drops it.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { usableNames, gridId, fetchRorFacts } from '../src/ror.js';
import { discoverPeople } from '../src/discover.js';

// Karolinska Institutet's live ROR v2 record, trimmed to the fields used here.
const KAROLINSKA = {
  external_ids: [
    { type: 'fundref', preferred: '501100004047', all: ['501100004047'] },
    { type: 'grid', preferred: 'grid.4714.6', all: ['grid.4714.6'] },
    { type: 'isni', preferred: null, all: ['0000 0004 1937 0626'] },
  ],
  names: [
    { value: 'KI', types: ['acronym'] },
    { value: 'Karoliininen instituutti', types: ['label'] },
    { value: 'Karolinska Institute', types: ['alias'] },
    { value: 'Karolinska Institutet', types: ['label', 'ror_display'] },
    { value: 'Royal Caroline Institute', types: ['alias'] },
  ],
  relationships: [
    { type: 'child', label: 'Center for Innovative Medicine', id: 'https://ror.org/00dgqhm63' },
    { type: 'related', label: 'Karolinska University Hospital', id: 'https://ror.org/00m8d6786' },
    { type: 'parent', label: 'Somewhere', id: 'https://ror.org/000000000' },
  ],
};

test('labels, display names and aliases are usable; acronyms are not', () => {
  assert.deepEqual(usableNames(KAROLINSKA), [
    'Karoliininen instituutti',
    'Karolinska Institute',
    'Karolinska Institutet',
    'Royal Caroline Institute',
  ]);
});

test('a name too short to be a needle is dropped whatever its type', () => {
  // "KI" as a substring matches a large part of ORCID. A needle that matches
  // everything turns the filter off while the result still looks filtered.
  const rec = { names: [{ value: 'KI', types: ['label'] }, { value: 'TU', types: ['alias'] }] };
  assert.deepEqual(usableNames(rec), []);
});

test('usableNames survives a record with nothing in it', () => {
  assert.deepEqual(usableNames(null), []);
  assert.deepEqual(usableNames({}), []);
  assert.deepEqual(usableNames({ names: [{ value: 'X' }] }), [], 'a name with no types is not usable');
});


test('the GRID id is taken from the registry record, preferring the preferred one', () => {
  assert.equal(gridId(KAROLINSKA), 'grid.4714.6');
  assert.equal(gridId({ external_ids: [{ type: 'grid', all: ['grid.9.9'] }] }), 'grid.9.9');
  assert.equal(gridId({ external_ids: [{ type: 'isni', all: ['x'] }] }), null, 'only GRID counts');
  assert.equal(gridId(null), null);
});

test('an unreachable ROR record yields empty facts rather than an error', () => {
  // The search must still run; it simply matches on the ROR id alone, which is
  // the behaviour it had before this existed.
  return fetchRorFacts('056d84691', { get: async () => null }).then((f) => {
    assert.deepEqual(f.names, []);
    assert.equal(f.grid, null);
  });
});

test('fetchRorFacts asks ROR v2 for the id it was given', () => {
  const urls = [];
  return fetchRorFacts('056d84691', {
    get: async (url) => { urls.push(url); return KAROLINSKA; },
  }).then((f) => {
    assert.equal(urls.length, 1);
    assert.match(urls[0], /api\.ror\.org\/v2\/organizations\/056d84691$/);
    assert.ok(f.names.includes('Karolinska Institutet'));
    assert.equal(f.grid, 'grid.4714.6');
  });
});

// ── the defect this exists to fix ───────────────────────────────────────────

const row = (id) => ({ 'orcid-id': id, 'given-names': 'A', 'family-names': 'B', 'institution-name': [] });

/** An employment as the institution's own ORCID integration writes it: the
 *  organisation is disambiguated with RINGGOLD, and the source is the member. */
const ringgoldAsserted = {
  'affiliation-group': [{
    summaries: [{
      'employment-summary': {
        organization: {
          name: 'Karolinska Institutet',
          'disambiguated-organization': {
            'disambiguated-organization-identifier': '27106',
            'disambiguation-source': 'RINGGOLD',
          },
        },
        'role-title': 'Researcher',
        'start-date': { year: { value: '2021' } },
        source: { 'source-client-id': { path: '0000-0002-7539-5209' }, 'source-name': { value: 'Karolinska Institutet' } },
      },
    }],
  }],
};

const OPTS = { rors: ['056d84691'], byName: false, orgNames: [], assertedOnly: true };
const deps = (names, grid = null) => ({
  search: async () => ({ rows: [row('0000-0001-0000-0090')], totalFound: 1 }),
  employments: async () => ringgoldAsserted,
  resolveRorFacts: async () => ({ names, grid }),
});

test('without ROR names, a RINGGOLD-identified employment is dropped', () => {
  return discoverPeople(OPTS, deps([])).then((r) => {
    assert.equal(r.people.length, 0);
    assert.equal(r.breakdown.noOrgMatch, 1, 'the affiliation check is what rejected it');
    assert.deepEqual(r.rorNames, []);
  });
});

test('with ROR names, the same employment is kept and named as asserted', () => {
  return discoverPeople(OPTS, deps(usableNames(KAROLINSKA))).then((r) => {
    assert.equal(r.people.length, 1);
    assert.equal(r.people[0].assertedBy, 'organization');
    assert.equal(r.people[0].assertionSource, 'Karolinska Institutet');
    assert.equal(r.breakdown.noOrgMatch, 0);
    assert.ok(r.rorNames.includes('Karolinska Institutet'), 'the result says what it matched on');
  });
});

test('fast mode still resolves ROR, for the GRID id, but reports no names', () => {
  // The names are only ever compared against an employment, and fast mode opens
  // none. The GRID id is a different matter: it goes into the query.
  return discoverPeople(
    { rors: ['056d84691'], byName: false },
    {
      search: async () => ({ rows: [row('0000-0001-0000-0091')], totalFound: 1 }),
      resolveRorFacts: async () => ({ names: usableNames(KAROLINSKA), grid: 'grid.4714.6' }),
    },
  ).then((r) => {
    assert.deepEqual(r.rorNames, [], 'names that cannot be used are not reported as used');
    assert.deepEqual(r.gridIds, ['grid.4714.6']);
    assert.match(r.query, /grid-org-id:"grid\.4714\.6"/);
  });
});

test('the GRID id is OR-ed into the query beside the ROR id', () => {
  return discoverPeople(
    { rors: ['056d84691'], byName: false },
    {
      search: async () => ({ rows: [], totalFound: 0 }),
      resolveRorFacts: async () => ({ names: [], grid: 'grid.4714.6' }),
    },
  ).then((r) => {
    assert.equal(r.query, 'ror-org-id:"https://ror.org/056d84691" OR grid-org-id:"grid.4714.6"');
  });
});

test('no ROR criterion means no ROR request at all', () => {
  let asked = 0;
  return discoverPeople(
    { rors: [], orgNames: ['Karolinska Institutet'] },
    { search: async () => ({ rows: [], totalFound: 0 }), resolveRorFacts: async () => { asked++; return { names: [], grid: null }; } },
  ).then(() => assert.equal(asked, 0));
});

test('the ROR lookup runs once per id, not once per candidate', () => {
  const asked = [];
  const rows = Array.from({ length: 8 }, (_, i) => row(`0000-0001-0000-01${i}0`));
  return discoverPeople(
    { rors: ['056d84691', '03yrm5c26'], byName: false, assertedOnly: true },
    {
      search: async () => ({ rows, totalFound: 8 }),
      employments: async () => ringgoldAsserted,
      resolveRorFacts: async (id) => { asked.push(id); return { names: usableNames(KAROLINSKA), grid: null }; },
    },
  ).then(() => assert.deepEqual(asked, ['056d84691', '03yrm5c26']));
});
