// UI wiring. All the decisions live in discover.js and exporters.js; this file
// only moves values between the DOM and those modules, which is what keeps the
// filter behaviour testable in Node without a browser.

import { discoverPeople, normaliseRor, parseList, validateOptions } from './discover.js?v=6';
import { peopleToCsv, peopleToJson, exportFilename, downloadText } from './exporters.js?v=6';
import { LANGS, t, setLang, getLang, resolveLang } from './i18n/index.js?v=6';

const $ = (id) => document.getElementById(id);
const el = {
  form: $('search'), go: $('go'), cancel: $('cancel'), reset: $('reset'),
  error: $('error'), progress: $('progress'), barFill: $('bar-fill'), barLabel: $('bar-label'),
  results: $('results'), summary: $('summary'), breakdown: $('breakdown'), query: $('query'),
  modeTag: $('mode-tag'), tablewrap: $('tablewrap'), cmdTitle: $('cmd-title'), rorNames: $('ror-names'),
  dlCsv: $('dl-csv'), dlJson: $('dl-json'), lang: $('lang'), theme: $('theme'),
};

const VIEWS = ['search', 'how', 'caveats', 'about'];
const VIEW_TITLE = { search: 'nav.search', how: 'how.title', caveats: 'caveats.title', about: 'about.title' };

/** The last completed run, which is what the export buttons write out. */
let last = null;
/** The options of the most recent run, set before it finishes. `last` is not
 *  enough: a view change while the first search is still in flight would
 *  otherwise rewrite the URL without the search in it. */
let searched = null;
let controller = null;
let view = 'search';

const escapeHtml = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// ── views ───────────────────────────────────────────────────────────────────

function showView(next) {
  view = VIEWS.includes(next) ? next : 'search';
  for (const node of document.querySelectorAll('.view')) node.hidden = node.dataset.view !== view;
  for (const b of document.querySelectorAll('.nav-item')) b.classList.toggle('active', b.dataset.view === view);
  el.cmdTitle.textContent = t(VIEW_TITLE[view]);
  writeUrl();
}

// ── i18n ────────────────────────────────────────────────────────────────────

function applyI18n() {
  document.documentElement.lang = getLang();
  for (const node of document.querySelectorAll('[data-i18n]')) node.textContent = t(node.dataset.i18n);
  for (const node of document.querySelectorAll('[data-i18n-html]')) node.innerHTML = t(node.dataset.i18nHtml);
  for (const node of document.querySelectorAll('[data-i18n-attr]'))
    for (const pair of node.dataset.i18nAttr.split(';')) {
      const [attr, key] = pair.split(':');
      if (attr && key) node.setAttribute(attr.trim(), t(key.trim()));
    }
  for (const b of el.lang.querySelectorAll('button')) b.setAttribute('aria-current', String(b.dataset.code === getLang()));
  el.cmdTitle.textContent = t(VIEW_TITLE[view]);
  // The rendered result carries translated headers and labels, so it has to be
  // redrawn: switching language with a table on screen must not leave it in the
  // language it was drawn in.
  if (last) render(last);
}

function initLang() {
  el.lang.innerHTML = LANGS.map(
    (l) => `<button type="button" data-code="${l.code}" aria-current="false" title="${escapeHtml(l.label)}">${l.code.toUpperCase()}</button>`,
  ).join('');
  el.lang.addEventListener('click', (e) => {
    const code = e.target.closest('button')?.dataset.code;
    if (!code) return;
    setLang(code);
    try { localStorage.setItem('orcid-finder:lang', code); } catch { /* private mode */ }
    applyI18n();
    writeUrl();
  });
  let stored = null;
  try { stored = localStorage.getItem('orcid-finder:lang'); } catch { /* private mode */ }
  const fromUrl = new URLSearchParams(location.search).get('lang');
  setLang(resolveLang(fromUrl || stored, navigator.languages ?? [navigator.language]));
}

// ── theme ───────────────────────────────────────────────────────────────────
// The stored theme is stamped on <html> by an inline script in the head, before
// first paint, so nothing flashes here.

function initTheme() {
  el.theme.addEventListener('click', () => {
    const dark = document.documentElement.dataset.theme
      ? document.documentElement.dataset.theme === 'dark'
      : matchMedia('(prefers-color-scheme: dark)').matches;
    const next = dark ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('orcid-finder:theme', next); } catch { /* private mode */ }
  });
}

// ── form ↔ options ──────────────────────────────────────────────────────────

const num = (v) => {
  const n = parseInt(v, 10);
  return Number.isInteger(n) ? n : null;
};

function readForm() {
  return {
    rors: parseList($('rors').value).map(normaliseRor),
    ringgolds: parseList($('ringgolds').value),
    orgNames: parseList($('orgNames').value),
    byRor: $('byRor').checked,
    byName: $('byName').checked,
    affiliationStatus: document.querySelector('#status input:checked')?.value ?? 'any',
    keywords: parseList($('keywords').value),
    roleTitles: parseList($('roleTitles').value),
    excludeRoleTitles: parseList($('excludeRoleTitles').value),
    departments: parseList($('departments').value),
    countries: parseList($('countries').value),
    startFrom: num($('startFrom').value),
    startTo: num($('startTo').value),
    currentOnly: $('currentOnly').checked,
    requireStartDate: $('requireStartDate').checked,
    assertedOnly: $('assertedOnly').checked,
    maxRows: parseInt($('maxRows').value, 10) || 200,
  };
}

function writeForm(o) {
  const list = (id, v) => { $(id).value = (v ?? []).join(', '); };
  list('rors', o.rors);
  list('ringgolds', o.ringgolds);
  list('orgNames', o.orgNames);
  list('keywords', o.keywords);
  list('roleTitles', o.roleTitles);
  list('excludeRoleTitles', o.excludeRoleTitles);
  list('departments', o.departments);
  list('countries', o.countries);
  $('byRor').checked = o.byRor !== false;
  $('byName').checked = o.byName !== false;
  const status = document.querySelector(`#status input[value="${o.affiliationStatus ?? 'any'}"]`)
    ?? document.querySelector('#status input[value="any"]');
  status.checked = true;
  $('startFrom').value = o.startFrom ?? '';
  $('startTo').value = o.startTo ?? '';
  $('currentOnly').checked = !!o.currentOnly;
  $('requireStartDate').checked = !!o.requireStartDate;
  $('assertedOnly').checked = !!o.assertedOnly;
  $('maxRows').value = o.maxRows ?? 200;
}

/**
 * Mirror the search, the language and the view into the URL, so a result can be
 * linked, bookmarked and cited. A tool whose output cannot be pointed at is not
 * reproducible.
 */
function writeUrl(options) {
  const o = options ?? searched;
  const p = new URLSearchParams();
  if (o) {
    const list = (key, v) => { if (v?.length) p.set(key, v.join(',')); };
    list('ror', o.rors);
    list('ringgold', o.ringgolds);
    list('org', o.orgNames);
    list('kw', o.keywords);
    list('role', o.roleTitles);
    list('xrole', o.excludeRoleTitles);
    list('dept', o.departments);
    list('country', o.countries);
    if (!o.byRor) p.set('byRor', '0');
    if (!o.byName) p.set('byName', '0');
    if (o.affiliationStatus && o.affiliationStatus !== 'any') p.set('status', o.affiliationStatus);
    if (o.startFrom !== null) p.set('from', String(o.startFrom));
    if (o.startTo !== null) p.set('to', String(o.startTo));
    if (o.currentOnly) p.set('current', '1');
    if (o.requireStartDate) p.set('started', '1');
    if (o.assertedOnly) p.set('asserted', '1');
    if (o.maxRows !== 200) p.set('max', String(o.maxRows));
  }
  if (view !== 'search') p.set('view', view);
  p.set('lang', getLang());
  history.replaceState(null, '', `${location.pathname}?${p}`);
}

function readUrl() {
  const p = new URLSearchParams(location.search);
  if (!p.has('ror') && !p.has('org') && !p.has('ringgold')) return null;
  return {
    rors: parseList(p.get('ror')).map(normaliseRor),
    ringgolds: parseList(p.get('ringgold')),
    orgNames: parseList(p.get('org')),
    byRor: p.get('byRor') !== '0',
    byName: p.get('byName') !== '0',
    affiliationStatus: p.get('status') ?? 'any',
    keywords: parseList(p.get('kw')),
    roleTitles: parseList(p.get('role')),
    excludeRoleTitles: parseList(p.get('xrole')),
    departments: parseList(p.get('dept')),
    countries: parseList(p.get('country')),
    startFrom: num(p.get('from')),
    startTo: num(p.get('to')),
    currentOnly: p.get('current') === '1',
    requireStartDate: p.get('started') === '1',
    assertedOnly: p.get('asserted') === '1',
    maxRows: parseInt(p.get('max') ?? '200', 10) || 200,
  };
}

// ── run ─────────────────────────────────────────────────────────────────────

function showError(message) {
  el.error.textContent = message;
  el.error.hidden = !message;
}

function busy(on) {
  el.go.disabled = on;
  el.go.textContent = t(on ? 'form.searching' : 'form.submit');
  el.cancel.hidden = !on;
  el.progress.hidden = !on;
  if (!on) el.barFill.style.width = '0%';
}

async function run(options) {
  const o = options ?? readForm();
  showError('');

  // The rules live in discover.js, where they are testable; this only turns the
  // key it returns into a sentence.
  const invalid = validateOptions(o);
  if (invalid) return showError(t(`err.${invalid.key}`, { id: invalid.id }));

  searched = o;
  writeUrl(o);
  controller = new AbortController();
  busy(true);
  el.barLabel.textContent = t('status.searching');

  try {
    const result = await discoverPeople(o, {
      signal: controller.signal,
      onProgress: ({ phase, done, total }) => {
        if (phase === 'employments') {
          el.barFill.style.width = `${total ? Math.round((done / total) * 100) : 0}%`;
          el.barLabel.textContent = t('status.reading', { done, total });
        }
      },
    });
    last = { ...result, filters: o, retrievedAt: new Date() };
    render(last);
  } catch {
    showError(t('err.failed'));
  } finally {
    busy(false);
    controller = null;
  }
}

// ── render ──────────────────────────────────────────────────────────────────

function render(r) {
  el.results.hidden = false;
  el.modeTag.textContent = t(r.mode === 'full' ? 'res.mode.full' : 'res.mode.fast');
  el.summary.textContent = [
    t('res.summary', { kept: r.people.length, scanned: r.scanned }),
    t('res.totalFound', { total: r.totalFound.toLocaleString(getLang()) }),
    r.aborted ? t('res.aborted') : '',
  ].filter(Boolean).join(' ');
  el.query.textContent = `${t('res.query')}: ${r.query}`;

  const b = r.breakdown;
  const chips = [
    ['bd.noOrgMatch', b.noOrgMatch],
    ['bd.noCountryMatch', b.noCountryMatch],
    ['bd.noDepartmentMatch', b.noDepartmentMatch],
    ['bd.noRoleMatch', b.noRoleMatch],
    ['bd.roleExcluded', b.roleExcluded],
    ['bd.noStartDate', b.noStartDate],
    ['bd.startOutOfRange', b.startOutOfRange],
    ['bd.selfAsserted', b.selfAsserted],
    ['bd.pastEmployment', b.pastEmployment],
    ['bd.unreachable', b.unreachable],
  ]
    // null means the filter was never applied, so it has nothing to report. Zero
    // means it ran and dropped nobody, which is worth showing.
    .filter(([, n]) => n !== null && n !== undefined && n > 0)
    .map(([key, n]) => `<span class="tag">${escapeHtml(t(key, { n }))}</span>`);
  el.breakdown.innerHTML = chips.length
    ? `<span class="col-title">${escapeHtml(t('bd.title'))}</span>${chips.join('')}`
    : '';
  // What the affiliation check actually compared against, when it is more than
  // the ROR id the user typed.
  el.rorNames.innerHTML = r.rorNames?.length
    ? `<span class="tag">${escapeHtml(t('res.rorNames', { names: r.rorNames.join(', ') }))}</span>`
    : '';

  el.dlCsv.disabled = r.people.length === 0;
  el.dlJson.disabled = r.people.length === 0;

  if (!r.people.length) {
    el.tablewrap.innerHTML = `<div class="empty">${escapeHtml(t('res.empty'))}</div>`;
    return;
  }

  // 'Matched by' is only shown in fast mode. In full mode every kept row matched
  // through an employment by construction, so the column would repeat one word
  // down the table and push the columns that do carry information off the edge.
  const cols = r.mode === 'full'
    ? ['col.orcid', 'col.name', 'col.role', 'col.department', 'col.organization', 'col.country', 'col.start', 'col.end', 'col.asserted']
    : ['col.orcid', 'col.name', 'col.organization', 'col.matched'];

  const head = cols.map((c) => `<th>${escapeHtml(t(c))}</th>`).join('');
  const rows = r.people.map((p) => {
    const cell = (v) => `<td>${escapeHtml(v ?? '')}</td>`;
    const idCell = `<td class="nowrap"><a class="mono" href="https://orcid.org/${escapeHtml(p.orcid)}" target="_blank" rel="noreferrer">${escapeHtml(p.orcid)}</a></td>`;
    const matched = () => badge(p.matchedBy, t(`matched.${p.matchedBy}`), p.matchedBy === 'ror_only' ? t('matched.ror_only.title') : null);
    return r.mode === 'full'
      ? `<tr>${idCell}${cell(p.name)}${cell(p.roleTitle)}${cell(p.department)}${cell(p.organization)}` +
        `<td class="nowrap" title="${escapeHtml(p.city ?? '')}">${escapeHtml(p.country ?? '')}</td>` +
        `<td class="nowrap">${escapeHtml(p.startDate ?? '')}</td><td class="nowrap">${escapeHtml(p.endDate ?? '')}</td>` +
        `${assertionCell(p)}</tr>`
      : `<tr>${idCell}${cell(p.name)}${cell(p.organization)}${matched()}</tr>`;
  }).join('');
  el.tablewrap.innerHTML = `<table><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table>`;
}

const badge = (kind, label, title) =>
  `<td><span class="badge ${escapeHtml(kind)}"${title ? ` title="${escapeHtml(title)}"` : ''}>${escapeHtml(label)}</span></td>`;

/**
 * Who asserted the employment. An organisation-asserted row shows the asserting
 * body by name, because "asserted by an organisation" is only worth anything
 * when the reader can see which one.
 */
function assertionCell(p) {
  if (!p.assertedBy) return '<td></td>';
  const label = p.assertedBy === 'organization' && p.assertionSource
    ? p.assertionSource
    : t(`asserted.${p.assertedBy}`);
  return badge(p.assertedBy, label, t(`asserted.${p.assertedBy}.title`));
}

// ── exports ─────────────────────────────────────────────────────────────────

function meta() {
  return {
    query: last.query, mode: last.mode, filters: last.filters,
    totalFound: last.totalFound, scanned: last.scanned, rorNames: last.rorNames, gridIds: last.gridIds,
    breakdown: last.breakdown, retrievedAt: last.retrievedAt,
  };
}

// ── boot ────────────────────────────────────────────────────────────────────

initLang();
initTheme();

for (const b of document.querySelectorAll('.nav-item'))
  b.addEventListener('click', () => showView(b.dataset.view));

el.form.addEventListener('submit', (e) => { e.preventDefault(); run(); });
el.cancel.addEventListener('click', () => controller?.abort());
el.reset.addEventListener('click', () => {
  writeForm({ byRor: true, byName: true, affiliationStatus: 'any', maxRows: 200 });
  last = null;
  searched = null;
  el.results.hidden = true;
  showError('');
  writeUrl();
});
el.dlCsv.addEventListener('click', () => {
  if (last) downloadText(exportFilename(last.filters, 'csv'), 'text/csv', peopleToCsv(last.people));
});
el.dlJson.addEventListener('click', () => {
  if (last) downloadText(exportFilename(last.filters, 'json'), 'application/json', peopleToJson(last.people, meta()));
});

// Read the URL BEFORE anything writes to it. showView() rewrites the query
// string, so reading afterwards finds a URL this file has already emptied, and
// a linked search silently becomes a blank form.
const fromUrl = readUrl();
const startView = new URLSearchParams(location.search).get('view');
if (VIEWS.includes(startView)) view = startView;
if (fromUrl) { searched = fromUrl; writeForm(fromUrl); }
applyI18n();
showView(view);

// A URL that carries a search runs it: that is what makes a result linkable.
if (fromUrl) run(fromUrl);
