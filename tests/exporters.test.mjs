// The export layer. Aimed at the failures that still produce a file: a sheared
// row, a formula that executes on open, a column that quietly went missing.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import {
  CITATION, COLUMNS, TOOL, csvField, otherNameList, toCsv, toRecord, peopleToCsv, peopleToJson,
  exportFilename, variantColumns,
} from '../src/exporters.js';

const person = (over = {}) => ({
  orcid: '0000-0002-1825-0097',
  name: 'Josiah Carberry',
  givenName: 'Josiah',
  familyName: 'Carberry',
  roleTitle: 'Professor',
  department: 'Psychoceramics',
  organization: 'Brown University',
  country: 'US',
  city: 'Providence',
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

test('the employment address is exported as country and city', () => {
  const r = toRecord(person());
  assert.equal(r.country, 'US');
  assert.equal(r.city, 'Providence');
  assert.equal(toRecord(person({ country: null, city: null })).country, '');
});

// ── The provenance header and the name variants ────────────────────────────

const cff = readFileSync(fileURLToPath(new URL('../CITATION.cff', import.meta.url)), 'utf8');
const cffField = (name) => new RegExp(`^${name}:\\s*"?([^"\\n]+?)"?\\s*$`, 'm').exec(cff)?.[1];

test('the identity written into every export is the one CITATION.cff publishes', () => {
  // Three copies of a version number is three chances to hand out a stale one,
  // and the copy that ends up in a stranger's supplementary table is the one
  // nobody can correct afterwards. CITATION.cff is what Zenodo and GitHub read,
  // so it is the side that wins.
  assert.equal(TOOL.version, cffField('version'), 'TOOL.version and CITATION.cff disagree');
  assert.equal(TOOL.doi, `https://doi.org/${cffField('doi')}`, 'the concept DOI disagrees');
  assert.equal(TOOL.url, cffField('url'));
  assert.equal(TOOL.repository, cffField('repository-code'));
  assert.equal(TOOL.license, cffField('license'));
  // The author as a citation renders them: family name, then the given initial.
  const family = /^\s*-?\s*family-names:\s*"([^"]+)"/m.exec(cff)[1];
  const given = /^\s*given-names:\s*"([^"]+)"/m.exec(cff)[1];
  assert.equal(TOOL.author, `${family}, ${given[0]}.`);
});

test('the citation names the tool, its version and the concept DOI', () => {
  assert.match(CITATION, /orcid-finder \(v\d+\.\d+\.\d+\)/);
  assert.ok(CITATION.includes(TOOL.doi), 'a citation without the DOI is not one');
  // The CONCEPT DOI, not a version one: it has to keep resolving after the next
  // release, which is exactly when someone reads the file.
  assert.ok(!/zenodo\.\d+\/\d/.test(CITATION));
});

test('a signed CSV opens with comments and the header is still the first data line', () => {
  const csv = peopleToCsv([person()], { query: 'ror-org-id:"x"', mode: 'full', retrievedAt: new Date('2026-09-03T10:00:00Z') });
  const lines = csv.split('\r\n');
  const head = lines.findIndex((l) => !l.startsWith('#'));
  assert.ok(head > 0, 'the file carries no preamble');
  for (const l of lines.slice(0, head)) assert.match(l, /^# /, 'a preamble line that a reader cannot skip');
  assert.equal(lines[head], COLUMNS.join(','), 'the header moved or was rewritten');
  assert.equal(lines.length, head + 2, 'the preamble added or lost a data row');
  assert.ok(csv.includes(CITATION));
  assert.ok(csv.includes('Retrieved: 2026-09-03T10:00:00.000Z'));
});

test('an unsigned CSV is byte-for-byte the table, so a pipeline sees no change', () => {
  // The checkbox exists for readers with no comment handling. If the "off"
  // position still wrote a line, it would be a checkbox that does nothing.
  assert.equal(peopleToCsv([person()]).split('\r\n')[0], COLUMNS.join(','));
  assert.equal(peopleToCsv([person()], null), peopleToCsv([person()]));
});

test('a line break in the query cannot break out of the comment block', () => {
  // The query is user input. A raw newline inside it would end the comment and
  // leave the remainder sitting where a data row goes, which a reader that skips
  // `#` would then parse as one.
  const csv = peopleToCsv([], { query: 'evil\r\nnot,a,row' });
  for (const l of csv.split('\r\n').slice(0, -1)) assert.match(l, /^# /);
  assert.ok(csv.includes('# Query: evil not,a,row'));
});

test('the preamble reports the rows it actually carries, not the number it was told', () => {
  const csv = peopleToCsv([person(), person()], { kept: 999, mode: 'fast' });
  assert.ok(csv.includes('kept 2'), 'the count came from the caller rather than the file');
  assert.ok(!csv.includes('kept 999'));
});

test('the name variants are exported as their own columns', () => {
  const r = toRecord(person({ creditName: 'A. Eghdam', otherNames: ['Aboozar Eghdam', 'اBoozar'] }));
  assert.equal(r.credit_name, 'A. Eghdam');
  // Piped, not comma-joined, for the same reason `institutions` is.
  assert.equal(r.other_names, 'Aboozar Eghdam | اBoozar');
  assert.equal(toRecord(person()).other_names, '', 'an account with no variants must not export "undefined"');
});

test('the JSON export names itself the same way the CSV does', () => {
  const doc = JSON.parse(peopleToJson([]));
  assert.equal(doc.tool, TOOL.name);
  assert.equal(doc.version, TOOL.version);
  assert.equal(doc.cite_as, CITATION);
  assert.equal(doc.doi, TOOL.doi);
  assert.equal(doc.license, TOOL.license);
});

// ── The split variant columns ───────────────────────────────────────────────

const csvRows = (csv) => csv.split('\r\n').map((l) => l.split(','));

test('the CSV grows one column per variant, sized to the widest account in the result', () => {
  const csv = peopleToCsv([
    person({ otherNames: ['Isabel Carolin Schroeter', 'Isabel Carolin Schröter'] }),
    person({ otherNames: [] }),
    person({ otherNames: ['A.A. Kuznetsov', 'Andrei Kuznetsov', 'Andrey A. Kuznetsov'] }),
  ]);
  const [head, ...rows] = csvRows(csv);
  assert.deepEqual(head.slice(COLUMNS.length), ['other_name_1', 'other_name_2', 'other_name_3']);
  // Every row is as wide as the header, including the account with none: a short
  // row is the classic silent corruption, and the file still opens.
  for (const r of rows) assert.equal(r.length, head.length);
  assert.deepEqual(rows[1].slice(COLUMNS.length), ['', '', '']);
  assert.deepEqual(rows[2].slice(COLUMNS.length), ['A.A. Kuznetsov', 'Andrei Kuznetsov', 'Andrey A. Kuznetsov']);
});

test('a result where nobody declares a variant gets no extra column at all', () => {
  // 94.3% of accounts declare none, so this is the ordinary case, and paying for
  // the feature with an empty column on every one of those rows is not the deal.
  assert.deepEqual(variantColumns([person({ otherNames: [] })]), []);
  assert.equal(csvRows(peopleToCsv([person({ otherNames: [] })]))[0].join(','), COLUMNS.join(','));
});

test('the split columns never move a fixed one, whatever the width of the result', () => {
  // This is why the block sits at the end. A variable-width block in the middle
  // would move `role_title` between two runs that differ only in their data, and
  // a reader working by position would break on that difference.
  const narrow = csvRows(peopleToCsv([person({ otherNames: [] })]))[0];
  const wide = csvRows(peopleToCsv([person({ otherNames: ['a', 'b', 'c'] })]))[0];
  assert.deepEqual(wide.slice(0, COLUMNS.length), narrow.slice(0, COLUMNS.length));
  assert.equal(wide.indexOf('role_title'), narrow.indexOf('role_title'));
});

test('the joined column and the split ones are the same list, never two answers', () => {
  const names = ['Claudia P. Castro', 'Claudia Pires'];
  const [head, row] = csvRows(peopleToCsv([person({ otherNames: names })]));
  const joined = row[head.indexOf('other_names')];
  // Quoted, because the pipe-joined value is one field: read it back rather than
  // trusting the raw cell.
  assert.equal(joined.replace(/^"|"$/g, ''), names.join(' | '));
  assert.deepEqual(row.slice(COLUMNS.length), names);
});

test('a blank other-name entry is dropped from the joined column and the split ones alike', () => {
  // An empty entry would otherwise show as a stray " | " in the joined column and
  // as an empty column between two full ones, which reads as a missing value.
  const p = person({ otherNames: ['', '  ', 'A. Lovelace'] });
  assert.deepEqual(otherNameList(p), ['A. Lovelace']);
  assert.equal(toRecord(p).other_names, 'A. Lovelace');
  assert.deepEqual(variantColumns([p]), ['other_name_1']);
});

test('the split block sits after the preamble like the rest of the table', () => {
  const csv = peopleToCsv([person({ otherNames: ['A. Lovelace'] })], { mode: 'fast' });
  const lines = csv.split('\r\n');
  const head = lines.findIndex((l) => !l.startsWith('#'));
  assert.ok(lines[head].endsWith(',other_name_1'));
  assert.equal(lines.length, head + 2);
});

test('the sample preamble printed in the README is not from an older version', () => {
  // A version number written into prose rots at the next release, and this one
  // sits in a block a reader copies to recognise the file. Pin it rather than
  // remembering to edit it.
  const readme = readFileSync(fileURLToPath(new URL('../README.md', import.meta.url)), 'utf8');
  const shown = [...readme.matchAll(/^# orcid-finder v(\d+\.\d+\.\d+)/gm)].map((m) => m[1]);
  assert.ok(shown.length, 'the README no longer shows a sample preamble; drop this test with it');
  for (const v of shown) assert.equal(v, TOOL.version);
  assert.ok(readme.includes(CITATION), 'the README citation line and CITATION disagree');
});
