// Wiring between the three files that have to agree: index.html, app.js and the
// locale catalogues. Every failure this catches is silent at runtime. A missing
// element id throws at boot and blanks the page; a missing CSS class renders an
// unstyled badge; a key nobody asks for is dead weight that still has to be
// translated three times.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { LOCALES } from '../src/i18n/index.js';

const read = (rel) => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8');
const html = read('../index.html');
const app = read('../src/app.js');
const css = read('../style.css');

test('every element id app.js reads exists in the page', () => {
  // `$('typo')` returns null, and the listener attached to it throws during
  // module evaluation. The whole page then comes up blank with no visible error.
  const have = new Set([...html.matchAll(/id="([^"]+)"/g)].map((m) => m[1]));
  const want = new Set([...app.matchAll(/\$\('([^']+)'\)/g)].map((m) => m[1]));
  assert.ok(want.size > 10, 'the scan found suspiciously few ids');
  for (const id of want) assert.ok(have.has(id), `app.js reads #${id}, which the page does not have`);
});

test('every id the page declares is read by the script or the stylesheet', () => {
  const declared = [...html.matchAll(/id="([^"]+)"/g)].map((m) => m[1]);
  for (const id of declared)
    assert.ok(app.includes(`'${id}'`) || css.includes(`#${id}`), `#${id} is declared and never used`);
});

test('every badge the table can emit has a rule in the stylesheet', () => {
  // The class comes from data: `matchedBy` and `assertedBy`. A value with no
  // rule renders as an unstyled pill, which reads as a rendering glitch rather
  // than as the missing style it is.
  for (const kind of ['employment', 'name', 'ror_only', 'self', 'organization', 'other', 'unknown'])
    assert.match(css, new RegExp(`\\.badge\\.${kind}\\b`), `.badge.${kind} has no rule`);
});

test('no locale key is defined and never asked for', () => {
  const source = html + app;
  // Some keys are assembled at render time: t(`asserted.${x}`) and
  // t(`asserted.${x}.title`). Collect those shapes and treat a key as asked for
  // when one of them can produce it.
  const templates = [...source.matchAll(/`([a-z][\w.]*)\.\$\{[^`]*\}(\.[\w.]+)?`/gi)]
    .map((m) => ({ head: m[1], tail: (m[2] ?? '').slice(1) }));
  const assembled = (key) =>
    templates.some(({ head, tail }) => {
      if (!key.startsWith(`${head}.`)) return false;
      const rest = key.slice(head.length + 1);
      return tail ? rest.endsWith(`.${tail}`) : !rest.includes('.');
    });

  const dead = Object.keys(LOCALES.en).filter((key) => !source.includes(key) && !assembled(key));
  assert.deepEqual(dead, [], 'these keys are translated three times and never shown');
});
