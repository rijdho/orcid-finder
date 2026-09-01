// The ORCID public API, and nothing else. Every request this tool makes goes
// straight from the visitor's browser to pub.orcid.org: there is no server of
// ours in the path, so nothing that is typed here is ever seen by anyone but
// ORCID itself.
//
// Two endpoints carry the whole tool:
//   /expanded-search  one call per 100 candidates, returns names + the
//                     institution names ORCID indexed for the account.
//   /{id}/employments the only place the API exposes role title, start date
//                     and whether an appointment has ended. One call per
//                     candidate, which is why the filters that need it are
//                     kept behind an explicit mode switch (see discover.js).

export const ORCID_API = 'https://pub.orcid.org/v3.0';

const HEADERS = { Accept: 'application/json' };

/** How long a single request may take before it is abandoned. */
const TIMEOUT_MS = 20_000;

/**
 * GET one JSON document, with a short backoff on 429 and 5xx. Shared by every
 * API this tool touches, so a second copy cannot come to disagree about what a
 * 429 means.
 *
 * Returns `null` rather than throwing: discovery fans out over hundreds of
 * records and a single unreachable one must not abort the whole run. A caller
 * that needs to distinguish "empty" from "failed" checks for null.
 *
 * 4xx other than 429 is not retried: a malformed query does not get better by
 * being asked again, and retrying it only spends the visitor's rate budget.
 */
export async function getJson(url, { tries = 3, signal, fetchImpl = fetch, sleep = defaultSleep } = {}) {
  for (let attempt = 0; attempt < tries; attempt++) {
    if (signal?.aborted) return null;
    let res;
    try {
      res = await fetchImpl(url, { headers: HEADERS, signal: joinSignals(signal, TIMEOUT_MS) });
    } catch {
      if (signal?.aborted) return null;
      if (attempt === tries - 1) return null;
      await sleep(500 * (attempt + 1));
      continue;
    }
    if (res.ok) {
      try {
        return await res.json();
      } catch {
        return null;
      }
    }
    if (res.status !== 429 && res.status < 500) return null;
    await sleep(800 * (attempt + 1));
  }
  return null;
}

const defaultSleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * A per-request signal that aborts on the caller's cancellation OR on timeout.
 * `AbortSignal.any` is the clean form; the manual fallback keeps the tool
 * working on browsers that predate it rather than failing every request.
 */
function joinSignals(signal, timeoutMs) {
  const timeout = AbortSignal.timeout(timeoutMs);
  if (!signal) return timeout;
  if (typeof AbortSignal.any === 'function') return AbortSignal.any([signal, timeout]);
  const ctrl = new AbortController();
  const abort = () => ctrl.abort();
  signal.addEventListener('abort', abort, { once: true });
  timeout.addEventListener('abort', abort, { once: true });
  return ctrl.signal;
}

/**
 * Page through expanded-search until `max` rows are collected or ORCID runs out.
 *
 * `num-found` is what ORCID says matches the query in total; it is reported
 * separately from what we actually pulled, because the difference between the
 * two is the honest answer to "did I see everything?".
 */
export async function expandedSearch(query, max, deps = {}) {
  const get = deps.get ?? getJson;
  const rows = [];
  let start = 0;
  let totalFound = 0;
  while (rows.length < max) {
    const url = `${ORCID_API}/expanded-search/?q=${encodeURIComponent(query)}&rows=100&start=${start}`;
    const data = await get(url, deps);
    if (!data) break;
    totalFound = data['num-found'] ?? totalFound;
    const page = data['expanded-result'] ?? [];
    rows.push(...page);
    start += page.length;
    if (page.length === 0 || start >= totalFound) break;
  }
  return { rows: rows.slice(0, max), totalFound };
}

/** The employments section of one record. Null when ORCID could not be reached. */
export function fetchEmployments(orcid, deps = {}) {
  const get = deps.get ?? getJson;
  return get(`${ORCID_API}/${orcid}/employments`, deps);
}
