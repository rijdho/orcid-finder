// i18n. Aimed at the failures that still render: a key that exists in one
// locale only, a placeholder that survives translation as literal text, a
// data-i18n attribute in the HTML pointing at a key nobody wrote.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { LOCALES, LANGS, DEFAULT_LANG, t, setLang, resolveLang, missingKeys, extraKeys, placeholders } from '../src/i18n/index.js';

const CODES = Object.keys(LOCALES);
const read = (rel) => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8');

test('the floor is English, German and Spanish, and the switcher lists all three', () => {
  assert.deepEqual(CODES.sort(), ['de', 'en', 'es']);
  assert.deepEqual(LANGS.map((l) => l.code).sort(), CODES.sort());
  // The label is the endonym: a reader looking for their own language scans for
  // "Deutsch", not for "German".
  assert.deepEqual(LANGS.map((l) => l.label), ['English', 'Deutsch', 'Español']);
});

test('every locale carries every key, and no key English does not have', () => {
  for (const code of CODES) {
    assert.deepEqual(missingKeys(code), [], `${code} is missing keys`);
    assert.deepEqual(extraKeys(code), [], `${code} carries keys English does not`);
  }
});

test('no locale ships an empty string', () => {
  for (const code of CODES)
    for (const [key, value] of Object.entries(LOCALES[code]))
      assert.ok(String(value).trim().length > 0, `${code}.${key} is empty`);
});

test('a translation carries exactly the placeholders the English does', () => {
  // Losing {n} in one locale turns a count into a sentence with a hole in it,
  // and it renders perfectly in the other two.
  for (const code of CODES)
    for (const key of Object.keys(LOCALES.en))
      assert.deepEqual(
        placeholders(LOCALES[code][key]),
        placeholders(LOCALES.en[key]),
        `${code}.${key} placeholders differ from English`,
      );
});

test('every key the page asks for exists', () => {
  const html = read('../index.html');
  const keys = new Set();
  for (const m of html.matchAll(/data-i18n(?:-html)?="([^"]+)"/g)) keys.add(m[1]);
  for (const m of html.matchAll(/data-i18n-attr="([^"]+)"/g))
    for (const pair of m[1].split(';')) keys.add(pair.split(':')[1]?.trim());
  keys.delete(undefined);
  assert.ok(keys.size > 20, 'the scan found suspiciously few keys');
  for (const key of keys) assert.ok(key in LOCALES.en, `index.html asks for a key nobody wrote: ${key}`);
});

test('every literal key app.js asks for exists', () => {
  const js = read('../src/app.js');
  for (const m of js.matchAll(/\bt\('([a-z][\w.]+)'/gi))
    assert.ok(m[1] in LOCALES.en, `app.js asks for a key nobody wrote: ${m[1]}`);
});

test('the match badges have a label in every locale', () => {
  // These are built as `matched.${p.matchedBy}` at render time, so a missing one
  // would surface as the raw key in the table rather than as an error.
  for (const kind of ['name', 'ror_only', 'employment'])
    for (const code of CODES) assert.ok(`matched.${kind}` in LOCALES[code]);
});

test('every assertion badge has a label and an explanation in every locale', () => {
  // These are built as `asserted.${p.assertedBy}` at render time, so a missing
  // one would surface as the raw key in the table rather than as an error.
  for (const kind of ['self', 'organization', 'other', 'unknown'])
    for (const code of CODES) {
      assert.ok(`asserted.${kind}` in LOCALES[code], `${code} lacks asserted.${kind}`);
      assert.ok(`asserted.${kind}.title` in LOCALES[code], `${code} lacks asserted.${kind}.title`);
    }
});

test('every view the rail can select has a title in every locale', () => {
  for (const key of ['nav.search', 'how.title', 'caveats.title', 'about.title'])
    for (const code of CODES) assert.ok(key in LOCALES[code], `${code} lacks ${key}`);
});

test('t interpolates, falls back to English, then to the key itself', () => {
  setLang('es');
  assert.equal(t('bd.noStartDate', { n: 3 }), '3 sin fecha de inicio');
  assert.equal(t('no.such.key'), 'no.such.key');
  // A key present only in English must still render, in English.
  const backup = LOCALES.es['res.title'];
  delete LOCALES.es['res.title'];
  assert.equal(t('res.title'), LOCALES.en['res.title']);
  LOCALES.es['res.title'] = backup;
  setLang(DEFAULT_LANG);
});

test('an unknown placeholder is left alone rather than blanked', () => {
  setLang('en');
  assert.equal(t('err.badRor', {}), LOCALES.en['err.badRor']);
});

test('the language is resolved from the URL, then the browser, then English', () => {
  assert.equal(resolveLang('de', ['es-ES']), 'de');
  assert.equal(resolveLang(null, ['de-AT', 'en']), 'de');
  assert.equal(resolveLang('fr', ['es-CL']), 'es', 'an unsupported request falls through to the browser');
  assert.equal(resolveLang(null, ['fr-FR']), 'en');
  assert.equal(resolveLang(null, []), 'en');
});
