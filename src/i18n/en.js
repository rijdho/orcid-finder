// English is the fallback locale: every key exists here, and the i18n test pins
// the other catalogues to this key set.
export const en = {
  'meta.description':
    'Search ORCID for the accounts that declare an institution, by ROR id or organisation name, narrow by role title, start date and current appointments, and download the result as CSV or JSON.',

  'ui.brand.tagline': 'Find the ORCID accounts that declare an institution',
  'ui.brand.source': 'source ↗',
  'ui.lede':
    'Give it a <b>ROR id</b> or an organisation name and it lists the ORCID accounts that declare that affiliation, then lets you narrow the list by role title, start date and whether the appointment is still current. The table downloads as <b>CSV</b> or <b>JSON</b>. Everything runs in your browser against the ORCID public API: no account, no key, and nothing passes through a server of ours.',
  'ui.lang.aria': 'Language',
  'ui.theme.title': 'Toggle light/dark theme',
  'ui.theme.aria': 'Toggle light/dark theme',

  'form.legend.searchBy': 'Search by',
  'form.legend.narrow': 'Narrow the result',
  'form.legend.scope': 'Scope',
  'form.byRor': 'ROR id',
  'form.byName': 'Organisation name',
  'form.rors.label': 'ROR id(s), comma-separated',
  'form.rors.ph': 'e.g. 03yrm5c26, 05gq02987',
  'form.rors.hint':
    'Several at once cover an institution registered as a parent ROR with children for faculties or campuses: a record may declare any of them.',
  'form.orgNames.label': 'Organisation name(s), comma-separated',
  'form.orgNames.ph': 'e.g. University of Vienna, Universität Wien',
  'form.orgNames.hint':
    'Matched as written by the account holder, so alternative spellings and the local-language form are worth adding.',
  'form.roleTitles.label': 'Role title contains',
  'form.roleTitles.ph': 'professor, postdoc (comma-separated)',
  'form.currentOnly': 'Only current appointments',
  'form.requireStartDate': 'Must have a start date',
  'form.employmentsHint':
    'These three read each candidate’s ORCID employment record: one extra request per candidate, so the search gets slower but far more precise.',
  'form.maxRows.label': 'Max candidates',
  'form.maxRows.hint':
    'How many of the matching accounts to pull and examine. ORCID pages them 100 at a time; 1000 is the ceiling here.',
  'form.submit': 'Search ORCID',
  'form.searching': 'Searching…',
  'form.cancel': 'Cancel',
  'form.reset': 'Reset',

  'err.noCriteria':
    'Pick at least one criterion: a ROR id or an organisation name, with its box ticked.',
  'err.badRor': '“{id}” is not a valid ROR id (nine characters starting with 0, e.g. 03jzk4720).',
  'err.failed': 'The search failed. The ORCID public API may be rate-limiting: try again in a minute.',

  'status.searching': 'Asking ORCID…',
  'status.reading': 'Reading employment records: {done} of {total}',

  'res.title': 'Results',
  'res.summary': '{kept} kept of {scanned} candidates examined.',
  'res.totalFound': 'ORCID reports {total} matching accounts.',
  'res.mode.fast': 'fast mode',
  'res.mode.full': 'full mode',
  'res.aborted': 'Cancelled: what had been examined by then is shown below.',
  'res.empty': 'No account matched. Loosen a filter, or check the ROR id.',
  'res.query': 'Query sent to ORCID',

  'bd.title': 'What the filters dropped',
  'bd.noOrgMatch': '{n} no affiliation match',
  'bd.noRoleMatch': '{n} role title did not match',
  'bd.noStartDate': '{n} no start date',
  'bd.pastEmployment': '{n} appointment already ended',
  'bd.unreachable': '{n} record could not be read',

  'export.csv': 'Download CSV',
  'export.json': 'Download JSON',
  'export.hint': 'The file carries every row of the table, not the page on screen.',

  'col.orcid': 'ORCID iD',
  'col.name': 'Name',
  'col.role': 'Role title',
  'col.department': 'Department',
  'col.organization': 'Organisation',
  'col.start': 'Start',
  'col.end': 'End',
  'col.matched': 'Matched by',

  'matched.name': 'name',
  'matched.ror_only': 'ROR only',
  'matched.employment': 'employment',
  'matched.ror_only.title':
    'ORCID matched the ROR id, but the institution name it lists is worded differently. This is normal and the match is genuine.',

  'how.title': 'How it works',
  'how.body':
    '<p>Two endpoints of the ORCID public API carry the whole tool, and which one runs is decided by the filters you tick.</p>' +
    '<p><b>Fast mode</b> is a single <code>expanded-search</code> call, OR-ing your criteria into one query. It returns names and the institution names ORCID has indexed for each account, so it answers "who declares this affiliation" in seconds however large the result.</p>' +
    '<p><b>Full mode</b> starts when you filter on role title, start date or current appointments. Those three fields exist only inside a record’s <code>/employments</code> document, so the tool reads one per candidate. That is one HTTP request each: precise, and proportionally slower.</p>' +
    '<p>A candidate found by ROR is kept even when the institution name on the record reads differently, because <code>expanded-search</code> returns those names without per-entry ROR ids. Dropping them would throw away exactly the records the ROR criterion was chosen to find. Such rows are marked <b>ROR only</b>.</p>' +
    '<p>Every count of what a filter dropped is attributed to the filter that actually dropped it, so a filter doing nothing is visible as a zero rather than hidden behind an earlier one.</p>',

  'caveats.title': 'Caveats',
  'caveats.body':
    '<ul>' +
    '<li><b>ORCID is self-asserted.</b> A record says what its owner typed. An institution’s real roster is larger than what ORCID shows and may differ in role titles, spelling and dates.</li>' +
    '<li><b>Absence is not evidence.</b> Staff who never added the affiliation, or who have no ORCID at all, cannot appear here. This is a discovery tool, not a headcount.</li>' +
    '<li><b>Names match as substrings.</b> "Vienna" matches every institution whose name contains it. The ROR id is the precise criterion; the name is the fallback for records that carry no ROR.</li>' +
    '<li><b>Only the first employment that qualifies is reported.</b> A person with several appointments at the same institution is shown once, under the one that passed your filters.</li>' +
    '<li><b>A partial end date is read at its latest instant.</b> "Ended 2026" counts as current for all of 2026, so that current staff are not silently dropped.</li>' +
    '<li><b>The public API rate-limits.</b> A large full-mode run can be throttled; the tool backs off and retries, and reports any record it still could not read.</li>' +
    '</ul>',

  'about.title': 'About',
  'about.body':
    '<p>orcid-finder is a single static page: no build step, no backend, no tracking, no cookies. It talks to <a href="https://info.orcid.org/documentation/features/public-api/" target="_blank" rel="noreferrer">the ORCID public API</a> directly from your browser, which is why nothing you type is visible to anyone but ORCID.</p>' +
    '<p>The filter set comes from a research-information system’s roster discovery, lifted out of its database so anyone can run the same search without one.</p>',
  'about.footer':
    'Built by <a href="https://rijdho.github.io" target="_blank" rel="noreferrer">@rijdho</a> · MIT licensed · <a href="https://github.com/rijdho/orcid-finder" target="_blank" rel="noreferrer">source on GitHub</a> · data from ORCID, used under their public API terms',
};
