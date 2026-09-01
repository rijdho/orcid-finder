// The export layer. Aimed at the failures that still produce a file: a sheared
// row, a formula that executes on open, a column that quietly went missing.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { COLUMNS, csvField, toCsv, toRecord, peopleToCsv, peopleToJson, exportFilename } from '../src/exporters.js';

const person = (over = {}) => ({
  orcid: '0000-0002-1825-0097',
  name: 'Josiah Carberry',
  givenName: 'Josiah',
  familyName: 'Carberry',
  roleTitle: 'Professor',
  department: 'Psychoceramics',
  organization: 'Brown University',
  startDate: '1990-01',
  endDate: null,
  institutions: ['Brown University', 'Wesleyan University'],
  matchedBy: 'employment',
  assertedBy: 'organization',
  assertionSource: 'Brown University',
  assertionOrigin: null,
  ...over,
});

test('a field with a comma is quoted, so the row cannot shear', () => {
  assert.equal(csvField('Physics, Institute of'), '"Physics, Institute of"');
});

test('an embedded quote is doubled and the field quoted', () => {
  assert.equal(csvField('the "old" faculty'), '"the ""old"" faculty"');
});

test('a line break inside a field is quoted rather than ending the row', () => {
  assert.equal(csvField('line one\nline two'), '"line one\nline two"');
});

test('a value that a spreadsheet would run as a formula is neutralised', () => {
  // These come out of ORCID records, which anyone can write into.
  assert.equal(csvField('=1+1'), "'=1+1");
  assert.equal(csvField('@SUM(A1)'), "'@SUM(A1)");
  assert.equal(csvField('\t=cmd|calc'), "'\t=cmd|calc");
});

test('a negative number stays a number', () => {
  assert.equal(csvField('-5'), '-5');
  assert.equal(csvField('-5.25'), '-5.25');
  assert.equal(csvField('-not-a-number'), "'-not-a-number");
});

test('empty and absent values render as an empty field, not "null"', () => {
  assert.equal(csvField(null), '');
  assert.equal(csvField(undefined), '');
  assert.equal(csvField(''), '');
});

test('rows are joined with CRLF, which is what RFC 4180 and Excel expect', () => {
  assert.equal(toCsv(['a', 'b'], [[1, 2], [3, 4]]), 'a,b\r\n1,2\r\n3,4');
});

test('a record carries every declared column, in order', () => {
  const r = toRecord(person());
  assert.deepEqual(Object.keys(r), COLUMNS);
});

test('institutions are joined with a pipe, never a comma', () => {
  // A comma here would be quoted correctly, but a reader that ignores quoting
  // would still shear the row: the pipe removes the question.
  assert.equal(toRecord(person()).institutions, 'Brown University | Wesleyan University');
});

test('the CSV header is the column list and the first row follows it', () => {
  const csv = peopleToCsv([person()]);
  const [header, first] = csv.split('\r\n');
  assert.equal(header, COLUMNS.join(','));
  assert.match(first, /^0000-0002-1825-0097,https:\/\/orcid\.org\/0000-0002-1825-0097,Josiah Carberry/);
});

test('a missing field exports as empty rather than shifting the columns', () => {
  const csv = peopleToCsv([person({ roleTitle: null, department: null, startDate: null })]);
  const cells = csv.split('\r\n')[1].split(',');
  assert.equal(cells.length, COLUMNS.length);
  assert.equal(cells[COLUMNS.indexOf('role_title')], '');
});

test('the JSON export carries the question as well as the answer', () => {
  const meta = {
    query: 'ror-org-id:"https://ror.org/03yrm5c26"',
    mode: 'full',
    filters: { rors: ['03yrm5c26'], orgNames: [] },
    totalFound: 42,
    scanned: 40,
    breakdown: { noOrgMatch: 3, noRoleMatch: null, noStartDate: null, pastEmployment: null, unreachable: 0 },
    retrievedAt: new Date('2026-08-31T10:00:00Z'),
  };
  const doc = JSON.parse(peopleToJson([person()], meta));
  assert.equal(doc.tool, 'orcid-finder');
  assert.equal(doc.query, meta.query);
  assert.equal(doc.mode, 'full');
  assert.equal(doc.total_found, 42);
  assert.equal(doc.scanned, 40);
  assert.equal(doc.kept, 1);
  assert.equal(doc.retrieved_at, '2026-08-31T10:00:00.000Z');
  assert.deepEqual(doc.results[0], toRecord(person()));
});

test('the JSON export stands up without any metadata', () => {
  const doc = JSON.parse(peopleToJson([]));
  assert.equal(doc.kept, 0);
  assert.deepEqual(doc.results, []);
});

test('the filename names what the file holds', () => {
  const now = new Date('2026-08-31T10:00:00Z');
  assert.equal(exportFilename({ rors: ['03yrm5c26'] }, 'csv', now), 'orcid-finder-03yrm5c26-2026-08-31.csv');
  assert.equal(
    exportFilename({ rors: [], orgNames: ['University of Vienna'] }, 'json', now),
    'orcid-finder-university-of-vienna-2026-08-31.json',
  );
  assert.equal(exportFilename({}, 'csv', now), 'orcid-finder-search-2026-08-31.csv');
});

test('a filename made only of punctuation still has a name', () => {
  assert.equal(exportFilename({ orgNames: ['!!!'] }, 'csv', new Date('2026-08-31T10:00:00Z')),
    'orcid-finder-search-2026-08-31.csv');
});

test('the assertion is exported as three columns, source named', () => {
  const r = toRecord(person());
  assert.equal(r.asserted_by, 'organization');
  assert.equal(r.assertion_source, 'Brown University');
  assert.equal(r.assertion_origin, '');
});

test('an unknown assertion exports empty, never "self"', () => {
  // Fast mode never opens an employment, so the field is absent rather than
  // self-asserted. Filling it in would turn a gap into a claim.
  const r = toRecord(person({ assertedBy: null, assertionSource: null }));
  assert.equal(r.asserted_by, '');
  assert.equal(r.assertion_source, '');
});
