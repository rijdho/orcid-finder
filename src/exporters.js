// CSV and JSON for the result table. Written out rather than pulled in, because
// the whole of it is the escaping rule and that rule is what a library would be
// imported for.

/** The export columns, in order. One place, so CSV and JSON cannot drift apart. */
export const COLUMNS = [
  'orcid',
  'orcid_url',
  'name',
  'given_name',
  'family_name',
  'role_title',
  'department',
  'organization',
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
    role_title: p.roleTitle ?? '',
    department: p.department ?? '',
    organization: p.organization ?? '',
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

export function peopleToCsv(people) {
  const records = people.map(toRecord);
  return toCsv(COLUMNS, records.map((r) => COLUMNS.map((c) => r[c])));
}

/**
 * The JSON export carries the query and the filter counts alongside the rows.
 * A file of results without the question that produced them is not reproducible,
 * and this tool exists to be cited from a methods section.
 */
export function peopleToJson(people, meta = {}) {
  return JSON.stringify(
    {
      tool: 'orcid-finder',
      source: 'ORCID public API v3.0',
      retrieved_at: (meta.retrievedAt ?? new Date()).toISOString(),
      query: meta.query ?? '',
      mode: meta.mode ?? null,
      // The names resolved from ROR and matched on, so a reader can see exactly
      // what the affiliation check compared against.
      ror_names: meta.rorNames ?? [],
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
