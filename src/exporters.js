// CSV and JSON for the result table. Written out rather than pulled in, because
// the whole of it is the escaping rule and that rule is what a library would be
// imported for.

/**
 * Who made this file. One place, because it is written into two export formats
 * and shown on the page, and three copies of a version number is three chances
 * to ship a stale one. `tests/exporters.test.mjs` pins every field of this
 * against `CITATION.cff`, which is the record Zenodo and GitHub read.
 */
export const TOOL = {
  name: 'orcid-finder',
  version: '1.2.0',
  year: 2026,
  author: 'Hartley Belmar, R.',
  url: 'https://rijdho.github.io/orcid-finder/',
  repository: 'https://github.com/rijdho/orcid-finder',
  // The CONCEPT DOI: it always resolves to the latest version, which is what a
  // reader following a citation wants. A version DOI would pin the file's reader
  // to the release that produced it and rot from there.
  doi: 'https://doi.org/10.5281/zenodo.22227424',
  license: 'AGPL-3.0-or-later',
  source: 'ORCID public API v3.0, ROR API v2',
};

/** The citation, in the one form that fits on a single line of a CSV comment. */
export const CITATION =
  `${TOOL.author} (${TOOL.year}). ${TOOL.name} (v${TOOL.version}) [Software]. ${TOOL.doi}`;

/** The export columns, in order. One place, so CSV and JSON cannot drift apart. */
export const COLUMNS = [
  'orcid',
  'orcid_url',
  'name',
  'given_name',
  'family_name',
  'credit_name',
  'other_names',
  'role_title',
  'department',
  'organization',
  'country',
  'city',
  'start_date',
  'end_date',
  'matched_by',
  'asserted_by',
  'assertion_source',
  'assertion_origin',
  'institutions',
];

/**
 * One discovered person as a flat record.
 * `institutions` is an array in the API and is joined with ' | ' rather than ','
 * so a CSV reader that ignores quoting still does not shear the row apart.
 */
export function toRecord(p) {
  return {
    orcid: p.orcid,
    orcid_url: `https://orcid.org/${p.orcid}`,
    name: p.name ?? '',
    given_name: p.givenName ?? '',
    family_name: p.familyName ?? '',
    // The published name and the "also known as" list, both straight from
    // expanded-search. They are the reason two rows that look like different
    // people are one, and the reason one row answers to a name the search never
    // asked for: an export meant for authority work has to carry them.
    credit_name: p.creditName ?? '',
    other_names: (p.otherNames ?? []).join(' | '),
    role_title: p.roleTitle ?? '',
    department: p.department ?? '',
    organization: p.organization ?? '',
    // The employment's own address, as ORCID holds it: an ISO-2 country code
    // and a city. Empty in fast mode, like everything else that lives inside
    // the employment record.
    country: p.country ?? '',
    city: p.city ?? '',
    start_date: p.startDate ?? '',
    end_date: p.endDate ?? '',
    matched_by: p.matchedBy ?? '',
    // Empty, not 'self': fast mode never opens an employment, so the assertion
    // is unknown rather than self-asserted.
    asserted_by: p.assertedBy ?? '',
    assertion_source: p.assertionSource ?? '',
    assertion_origin: p.assertionOrigin ?? '',
    institutions: (p.institutions ?? []).join(' | '),
  };
}

/**
 * A spreadsheet reads a field beginning with `=`, `+`, `-` or `@` as a formula, so
 * a value that arrived from a public record (a name, a role title, anything a
 * stranger can write into their own ORCID) becomes something the reader's Excel
 * executes on open. Prefixing an apostrophe is the fix Excel and LibreOffice both
 * understand: the cell shows the text and computes nothing.
 *
 * `\t` and `\r` are here because those programs strip them before deciding what
 * the field starts with, which turns `\t=cmd` back into a formula.
 */
function neutralise(s) {
  if (!/^[=+\-@\t\r]/.test(s)) return s;
  // A negative number is the one honest value that starts with one of these.
  if (/^-?\d+(\.\d+)?$/.test(s)) return s;
  return `'${s}`;
}

/**
 * A field is quoted when it contains a comma, a quote or a line break, and an
 * embedded quote is doubled. Skipping this is the classic silent corruption: one
 * department name with a comma in it shifts every later column of that row by one,
 * and the file still opens.
 */
export function csvField(value) {
  if (value === null || value === undefined) return '';
  const s = neutralise(String(value));
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** CRLF, which is what RFC 4180 says and what Excel expects. */
export function toCsv(headers, rows) {
  return [headers, ...rows].map((r) => r.map(csvField).join(',')).join('\r\n');
}

/**
 * A comment line is not part of RFC 4180, so anything that could be read as
 * structure has to be flattened out of it: a line break would end the comment
 * halfway and leave the rest of the value looking like a data row.
 */
const commentValue = (v) => String(v ?? '').replace(/[\r\n\t]+/g, ' ').trim();

/**
 * The provenance block that opens the CSV: who made the file, how to cite it,
 * and the question that produced the rows.
 *
 * The JSON export has carried this since it existed, for the reason written on
 * `peopleToJson`. The CSV is the file that actually gets opened, mailed on and
 * pasted into a supplementary table, and it was the one leaving without a name
 * on it. `#` is the comment convention every reader that has one understands
 * (`pandas.read_csv(..., comment='#')`, `read.csv(..., comment.char='#')`), and
 * the last line says so, because a reader that has none will show these as rows.
 */
export function csvPreamble(meta = {}) {
  const at = (meta.retrievedAt ?? new Date()).toISOString();
  const counts = [
    meta.mode ? `Mode: ${meta.mode}` : null,
    Number.isFinite(meta.totalFound) ? `found ${meta.totalFound}` : null,
    Number.isFinite(meta.scanned) ? `scanned ${meta.scanned}` : null,
    Number.isFinite(meta.kept) ? `kept ${meta.kept}` : null,
  ].filter(Boolean).join(' \u00b7 ');
  const lines = [
    `${TOOL.name} v${TOOL.version} \u00b7 ${TOOL.url}`,
    `Cite: ${CITATION}`,
    `License: ${TOOL.license} \u00b7 Source: ${TOOL.repository}`,
    `Data: ${TOOL.source}`,
    `Retrieved: ${at}`,
    meta.query ? `Query: ${meta.query}` : null,
    counts || null,
    meta.rorNames?.length ? `ROR names matched: ${meta.rorNames.join(' | ')}` : null,
    meta.gridIds?.length ? `GRID ids: ${meta.gridIds.join(' | ')}` : null,
    'These comment lines are not data. Skip lines starting with # when reading.',
  ];
  return lines.filter(Boolean).map((l) => `# ${commentValue(l)}`);
}

/**
 * `meta` is optional and the preamble is written only when it is given, so a
 * pipeline that wants nothing but the table can still have it: the page offers
 * the choice as a checkbox rather than deciding for the reader.
 */
export function peopleToCsv(people, meta = null) {
  const records = people.map(toRecord);
  const table = toCsv(COLUMNS, records.map((r) => COLUMNS.map((c) => r[c])));
  if (!meta) return table;
  return [...csvPreamble({ ...meta, kept: people.length }), table].join('\r\n');
}

/**
 * The JSON export carries the query and the filter counts alongside the rows.
 * A file of results without the question that produced them is not reproducible,
 * and this tool exists to be cited from a methods section.
 */
export function peopleToJson(people, meta = {}) {
  return JSON.stringify(
    {
      tool: TOOL.name,
      version: TOOL.version,
      cite_as: CITATION,
      doi: TOOL.doi,
      license: TOOL.license,
      url: TOOL.url,
      source: TOOL.source,
      retrieved_at: (meta.retrievedAt ?? new Date()).toISOString(),
      query: meta.query ?? '',
      mode: meta.mode ?? null,
      // The names resolved from ROR and matched on, so a reader can see exactly
      // what the affiliation check compared against.
      ror_names: meta.rorNames ?? [],
      grid_ids: meta.gridIds ?? [],
      filters: meta.filters ?? null,
      total_found: meta.totalFound ?? null,
      scanned: meta.scanned ?? null,
      kept: people.length,
      breakdown: meta.breakdown ?? null,
      results: people.map(toRecord),
    },
    null,
    2,
  );
}

/**
 * Name the file after what it holds, so a folder of exports stays readable:
 * the first ROR id or organisation name, then the date.
 */
export function exportFilename(filters = {}, ext = 'csv', now = new Date()) {
  const label = (filters.rors?.[0] ?? filters.orgNames?.[0] ?? 'search')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'search';
  return `orcid-finder-${label}-${now.toISOString().slice(0, 10)}.${ext}`;
}

/** Hand the browser a file. No-op outside one, so a Node import cannot crash. */
export function downloadText(filename, mime, text) {
  if (typeof document === 'undefined') return;
  const url = URL.createObjectURL(new Blob([text], { type: `${mime};charset=utf-8` }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
