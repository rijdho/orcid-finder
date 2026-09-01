// Asset versioning. There is no bundler here, so nothing content-hashes the
// files: the only thing that reaches a browser holding an old copy is the ?v=
// on the URL. This was learned the expensive way. Only the entry module carried
// a version, so a browser served a cached `orcid.js` against a fresh `ror.js`
// that imported a symbol the cached copy did not export, and the whole module
// graph aborted with no visible error: a blank tool that looked deployed.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const read = (rel) => readFileSync(fileURLToPath(new URL(rel, root)), 'utf8');

const srcFiles = [
  ...readdirSync(fileURLToPath(new URL('src/', root))).filter((f) => f.endsWith('.js')).map((f) => `src/${f}`),
  ...readdirSync(fileURLToPath(new URL('src/i18n/', root))).filter((f) => f.endsWith('.js')).map((f) => `src/i18n/${f}`),
];

/** Every relative import in the source tree, with the version it carries. */
function imports() {
  const found = [];
  for (const file of srcFiles)
    for (const m of read(file).matchAll(/from\s+'(\.[^']+)'/g))
      found.push({ file, specifier: m[1], version: /\?v=(\d+)$/.exec(m[1])?.[1] ?? null });
  return found;
}

test('the source tree actually has relative imports to check', () => {
  assert.ok(imports().length >= 5, 'the scan found suspiciously few imports');
});

test('every relative import carries a version', () => {
  for (const i of imports())
    assert.ok(i.version, `${i.file} imports '${i.specifier}' with no ?v=, so a cached copy can be served`);
});

test('every version in the app is the same number', () => {
  const html = read('index.html');
  const style = /style\.css\?v=(\d+)/.exec(html)?.[1];
  const entry = /src\/app\.js\?v=(\d+)/.exec(html)?.[1];
  assert.ok(style, 'index.html does not version the stylesheet');
  assert.ok(entry, 'index.html does not version the entry module');
  const versions = new Set([style, entry, ...imports().map((i) => i.version)]);
  assert.equal(
    versions.size, 1,
    `versions disagree (${[...versions].join(', ')}): bump them together or a mixed set of files is served`,
  );
});
