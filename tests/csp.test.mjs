// The Content-Security-Policy, and the things that would force it to be loosened.
//
// The policy is the only defence here that survives a mistake: escaping every
// value is a discipline someone can forget in one edit, while `default-src
// 'none'` stops the consequence. It also turns the page's central promise, that
// it contacts two hosts and no others, into something the browser enforces
// rather than something a reader has to take on trust.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { ORCID_API } from '../src/orcid.js';
import { ROR_API } from '../src/ror.js';

const read = (rel) => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8');
const html = read('../index.html');

const csp = (() => {
  const m = /http-equiv="Content-Security-Policy"\s+content="([^"]+)"/.exec(html);
  assert.ok(m, 'the page ships no Content-Security-Policy');
  return Object.fromEntries(
    m[1].split(';').map((d) => d.trim()).filter(Boolean)
      .map((d) => { const [k, ...v] = d.split(/\s+/); return [k, v]; }),
  );
})();

test('the policy denies everything it does not name', () => {
  assert.deepEqual(csp['default-src'], ["'none'"]);
  assert.deepEqual(csp['object-src'], ["'none'"]);
  assert.deepEqual(csp['base-uri'], ["'none'"]);
  assert.deepEqual(csp['form-action'], ["'none'"]);
});

test('scripts, styles and fonts come from this origin only', () => {
  // 'unsafe-inline' anywhere here would defeat the point, and a CDN host would
  // reintroduce exactly the tracking the page says it does not do.
  for (const directive of ['script-src', 'style-src', 'font-src'])
    assert.deepEqual(csp[directive], ["'self'"], `${directive} must be 'self' alone`);
});

test('connect-src names exactly the two APIs the code calls, and no more', () => {
  const origin = (url) => new URL(url).origin;
  const used = new Set([origin(ORCID_API), origin(ROR_API)]);
  assert.deepEqual(new Set(csp['connect-src']), used,
    'a host added to the code and not to the policy fails silently in the browser');
});

test('nothing in the page needs the policy loosened', () => {
  // Each of these would force 'unsafe-inline' back in.
  assert.equal(/\sstyle="/.test(html), false, 'an inline style attribute needs style-src unsafe-inline');
  assert.equal(/\son[a-z]+="/.test(html), false, 'an inline event handler needs script-src unsafe-inline');
  assert.equal(/<script(?![^>]*\ssrc=)/.test(html), false, 'an inline script needs a hash or unsafe-inline');
});

test('the theme bootstrap is a blocking script, so it still beats first paint', () => {
  // As type="module" it would be deferred and the stored theme would apply after
  // the page had already been painted light.
  const tag = /<script[^>]*theme-boot[^>]*>/.exec(html);
  assert.ok(tag, 'the theme bootstrap is not loaded');
  assert.equal(/type="module"|defer|async/.test(tag[0]), false);
});
