// English is the fallback locale: every key exists here, and the i18n test pins
// the other catalogues to this key set.
export const en = {
  'meta.description':
    'Search ORCID for the accounts that declare an institution, by ROR id or organisation name, narrow by role title, start date, current appointments and who asserted the record, and download the result as CSV or JSON.',

  'ui.brand.tagline': 'Find the ORCID accounts that declare an institution',
  'ui.brand.source': 'source ↗',
  'ui.lede':
    'Give it a <b>ROR id</b> or an organisation name and it lists the ORCID accounts that declare that affiliation, then lets you narrow the list by keyword, role, department, country, start date, whether the appointment is still current, and whether an organisation asserted it rather than the researcher. The table downloads as <b>CSV</b> or <b>JSON</b>. Everything runs in your browser against the public ORCID and ROR APIs: no account, no key, and nothing passes through a server of ours.',
  'ui.lang.aria': 'Language',
  'ui.theme.title': 'Toggle light/dark theme',
  'ui.theme.aria': 'Toggle light/dark theme',

  'form.byRor': 'ROR id',
  'form.byName': 'Organisation name',
  'form.rors.label': 'ROR id(s), comma-separated',
  'form.rors.ph': 'e.g. 056d84691',
  'form.rors.hint':
    'Several at once cover an institution registered as a parent ROR with children for faculties or campuses: a record may declare any of them. The GRID id ROR holds for each is added to the query automatically, because ORCID indexes the two separately.',
  'form.orgNames.label': 'Organisation name(s), comma-separated',
  'form.orgNames.ph': 'e.g. Karolinska Institutet',
  'form.orgNames.hint':
    'Matched as written by the account holder, so alternative spellings and the local-language form are worth adding.',
  'form.roleTitles.label': 'Role title contains',
  'form.roleTitles.ph': 'professor, postdoc (comma-separated)',
  'form.currentOnly': 'Only current appointments',
  'form.requireStartDate': 'Must have a start date',
  'form.employmentsHint':
    'Everything in this column reads each candidate’s ORCID employment record: one extra request per candidate, so the search gets slower but far more precise. Role exclusion happens here because ORCID’s query language has no negation.',
  'form.maxRows.label': 'Max candidates',
  'form.maxRows.hint':
    'How many of the matching accounts to pull and examine. ORCID pages them 100 at a time; 2000 is the ceiling here. Any filter in the middle column adds one request per candidate, so a run at the ceiling means about 2000 more of them and takes minutes.',
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

  'res.rorNames': 'Also matched on the names ROR registers for the id: {names}',
  'bd.title': 'What the filters dropped',
  'bd.noOrgMatch': '{n} no affiliation match',
  'bd.noRoleMatch': '{n} role title did not match',
  'bd.noStartDate': '{n} no start date',
  'bd.pastEmployment': '{n} appointment already ended',
  'bd.unreachable': '{n} record could not be read',

  'export.csv': 'Download CSV',
  'export.json': 'Download JSON',
  'export.hint': 'The file carries every row of the table, not the page on screen.',
  'export.provenance': 'Sign the CSV: cite and query header',
  'export.provenance.hint': 'Adds comment lines above the table naming the tool, its DOI and the query that produced the rows. Every line starts with #; a reader that does not skip comments (pandas: comment=\'#\') shows them as rows. The JSON export always carries this.',
  'alt.names': 'also known as',
  'alt.names.title': 'Other names this ORCID record carries: its published name and its “also known as” entries. Exported as credit_name and other_names.',

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


  'nav.label': 'View',
  'nav.search': 'Search',
  'rail.cite': 'Cite this tool',
  'rail.data': 'Data from ORCID and ROR',
  'form.assertedOnly': 'Only records asserted by an organisation',
  'bd.selfAsserted': '{n} self-asserted only',
  'col.asserted': 'Asserted by',
  'asserted.self': 'self',
  'asserted.organization': 'organisation',
  'asserted.other': 'another iD',
  'asserted.unknown': 'unknown',
  'asserted.unknown.title':
    'The employment carries no source, so who wrote it cannot be said. This does not mean the researcher wrote it.',
  'asserted.self.title':
    'The researcher entered this employment themselves. It may be perfectly accurate, but nothing outside the record stands behind it.',
  'asserted.organization.title':
    'A member organisation’s system wrote this employment into the record, so a second party stands behind it.',
  'asserted.other.title':
    'Another ORCID iD wrote this employment, which ORCID allows through a trusted-individual delegation.',

  'form.legend.institution': 'The institution',
  'form.legend.employment': 'The employment',
  'form.legend.topic': 'Topic and scope',
  'form.ringgolds.label': 'Ringgold id(s), comma-separated',
  'form.ringgolds.ph': 'e.g. 27106',
  'form.ringgolds.hint':
    'ORCID indexes Ringgold ids separately, and an institution’s own system may stamp one instead of a ROR id: adding it can more than double what the search sees. It is also coarser than a ROR id and may pull in a related organisation, such as a university hospital, so read the organisation column.',
  'form.status.label': 'Affiliation',
  'form.status.any': 'Any',
  'form.status.current': 'Current',
  'form.status.past': 'Past',
  'form.status.hint':
    'Current and past are indexed by ORCID only on the organisation name, so choosing one searches by name alone and the identifier fields sit out. Past is how you find former staff and alumni. This is not the same as “Only current appointments”: this asks ORCID which accounts it indexes as current, while that one reads each employment’s end date. Choosing Past and ticking that box asks for people who have both a finished and a running appointment here, which is rarely what anyone means.',
  'form.keywords.label': 'Keyword(s), comma-separated',
  'form.keywords.ph': 'epidemiology, oncology',
  'form.keywords.hint':
    'The keywords researchers put on their own ORCID record. Several are OR-ed together and the whole set narrows the institution, so this answers "who here works on this". Free: it goes into the same single query.',
  'form.excludeRoleTitles.label': 'Role title must not contain',
  'form.excludeRoleTitles.ph': 'phd, student',
  'form.departments.label': 'Department contains',
  'form.departments.ph': 'molecular medicine',
  'form.countries.label': 'Country code(s)',
  'form.countries.ph': 'SE, AT',
  'form.range.hint': 'A range already requires a start date, so “Must have a start date” adds nothing while one is set: it only changes which count reports the drop.',
  'form.startFrom.label': 'Started from',
  'form.startTo.label': 'Started to',
  'err.badRinggold': '“{id}” is not a valid Ringgold id. They are plain numbers, for instance 27106.',
  'err.statusNeedsName':
    'A current or past search needs an organisation name. ORCID indexes those two only on the name, never on a ROR, GRID or Ringgold id.',
  'err.badStartRange': 'The start range runs backwards: the first year is later than the last.',
  'bd.noCountryMatch': '{n} in another country',
  'bd.noDepartmentMatch': '{n} department did not match',
  'bd.roleExcluded': '{n} role title excluded',
  'bd.startOutOfRange': '{n} started outside the range',
  'col.country': 'Country',
  'how.title': 'How it works',
  'how.body':
    '<p>The tool uses two endpoints of the ORCID public API. Which one runs is decided by the filters you tick.</p>' +
    '<p><b>Fast mode</b> is a single <code>expanded-search</code> call, OR-ing your criteria into one query. It returns names and the institution names ORCID has indexed for each account, so it answers "who declares this affiliation" in seconds however large the result.</p>' +
    '<p><b>Full mode</b> starts when you filter on role title, start date, current appointments or who asserted the record. Those fields exist only inside a record’s <code>/employments</code> document, so the tool reads one per candidate. That is one HTTP request each: precise, and proportionally slower.</p>' +
    '<p><b>Who asserted the record</b> is the field ORCID calls the source. An employment the researcher typed in carries their own iD as its source; one written by a member organisation’s system, typically the university itself, carries that client instead, and the table names it. Both are shown, because the difference is between a claim and a claim a second party stands behind.</p>' +
    '<p>A candidate found by ROR is kept even when the institution name on the record reads differently, because <code>expanded-search</code> returns those names without per-entry ROR ids. Dropping them would throw away exactly the records the ROR criterion was chosen to find. Such rows are marked <b>ROR only</b>.</p>' +
    '<p><b>The ROR id alone is not enough</b> to recognise an employment. ORCID lets one be disambiguated with any scheme, and the identifiers an institution’s own system writes are not always ROR: they may be RINGGOLD or FUNDREF, which would drop exactly the organisation-asserted records. So each ROR id is first resolved to the names the registry holds for it, and those are matched on too. The result says which names it used. Registered acronyms are left out: a two-letter needle matches a large part of ORCID.</p>' +
    '<p>Every count of what a filter dropped is attributed to the filter that actually dropped it, so a filter doing nothing is visible as a zero rather than hidden behind an earlier one.</p>' +
    '<p><b>What leaves with the file.</b> Both exports name themselves. The CSV opens with comment lines carrying the tool, its version, its DOI and the query that produced the rows, so a table that has been mailed on can still be cited and re-run; the JSON has always carried the same. The signature can be switched off for a reader that does not skip comments. Both files also carry the other names an account answers to, as <code>credit_name</code> and <code>other_names</code>: the display name is built from the given and family fields, and those are often a legal or transliterated form that no publication uses.</p>',

  'caveats.title': 'Caveats',
  'caveats.body':
    '<ul>' +
    '<li><b>The email field is never shown or exported.</b> ORCID returns one for records whose owner made it public; this tool drops it. A downloaded list of people is personal data, and what it is used for is your responsibility: building a mailing list should not be the easy path.</li>' +
    '<li><b>Most of ORCID is self-asserted.</b> A record usually says what its owner typed. An institution’s real roster is larger than what ORCID shows and may differ in role titles, spelling and dates.</li>' +
    '<li><b>An organisation-asserted employment is evidence, not proof of the present.</b> It says that a member’s system wrote the entry at some point. It does not say the appointment still runs, and it does not mean the asserting organisation is the employer: funders and national aggregators assert too, which is why the table names the source.</li>' +
    '<li><b>Fast mode reports no source at all.</b> Who asserted an employment lives in the employment record, so the column is empty until a filter opens it. Empty means unknown, never self-asserted.</li>' +
    '<li><b>Absence is not evidence.</b> Staff who never added the affiliation, or who have no ORCID at all, cannot appear here. This is a discovery tool, not a headcount.</li>' +
    '<li><b>Names match as substrings.</b> "Vienna" matches every institution whose name contains it. The ROR id is the precise criterion; the name is the fallback for records that carry no ROR.</li>' +
    '<li><b>Only the first employment that qualifies is reported.</b> A person with several appointments at the same institution is shown once, under the one that passed your filters.</li>' +
    '<li><b>A partial end date is read at its latest instant.</b> "Ended 2026" counts as current for all of 2026, so that current staff are not silently dropped.</li>' +
    '<li><b>The public API rate-limits.</b> A large full-mode run can be throttled; the tool backs off and retries, and reports any record it still could not read.</li>' +
    '<li><b>The name variants are as incomplete as the rest of the record.</b> They are what the account holder chose to enter as a published name and under “also known as”. An empty column means nothing was declared, not that the person publishes under a single name.</li>' +
    '<li><b>The CSV signature is comment lines, which is a convention rather than a standard.</b> Every one starts with <code>#</code>, and a reader that does not skip comments parses them as rows. Untick the box when the file is going somewhere that will not.</li>' +
    '</ul>',

  'about.title': 'About',
  'about.body':
    '<p>orcid-finder is a single static page: no build step, no backend, no tracking, no cookies. It talks to <a href="https://info.orcid.org/documentation/features/public-api/" target="_blank" rel="noreferrer">the ORCID public API</a> and to <a href="https://ror.readme.io/" target="_blank" rel="noreferrer">the ROR API</a> directly from your browser, so no server of ours ever sees what you search for. Those two are the only hosts the page contacts. The only thing it keeps is the language and theme you picked, in your browser’s own storage.</p>' +
    '<p>The filter set comes from a research-information system’s roster discovery, lifted out of its database so anyone can run the same search without one.</p>',
  'about.footer':
    'Built by <a href="https://rijdho.github.io" target="_blank" rel="noreferrer">@rijdho</a> · AGPL-3.0-or-later · <a href="https://github.com/rijdho/orcid-finder" target="_blank" rel="noreferrer">source on GitHub</a> · data from ORCID and ROR, used under their public API terms',
};
