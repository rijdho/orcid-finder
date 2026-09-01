// The ROR API, used for one narrow purpose: turning a ROR id into the names the
// registry holds for it.
//
// This is not a convenience. ORCID lets an employment be disambiguated with any
// scheme, and the ones an institution's own system writes are frequently
// RINGGOLD or FUNDREF rather than ROR: Karolinska Institutet's ORCID
// integration, for instance, stamps `27106 / RINGGOLD` on the employments it
// asserts. Matching employments on the ROR id alone therefore drops precisely
// the organisation-asserted records, which are the most corroborated ones in
// the result. Resolving the ROR id to its registered names and matching on
// those as well is what keeps them.

import { getJson } from './orcid.js?v=6';

export const ROR_API = 'https://api.ror.org/v2/organizations';

/** The name types worth matching on. `acronym` is deliberately absent. */
const NAME_TYPES = new Set(['ror_display', 'label', 'alias']);

/**
 * The registered names usable as substring needles.
 *
 * Acronyms are excluded and anything shorter than four characters is dropped:
 * Karolinska's registered acronym is "KI", and "KI" as a substring matches a
 * large part of ORCID. A needle that matches everything is worse than no needle,
 * because it silently turns the filter off while the result still looks filtered.
 */
export function usableNames(record) {
  return [
    ...new Set(
      (record?.names ?? [])
        .filter((n) => (n.types ?? []).some((t) => NAME_TYPES.has(t)))
        .map((n) => String(n.value ?? '').trim())
        .filter((v) => v.length >= 4),
    ),
  ];
}

/**
 * The GRID id ROR holds for this organisation, if any.
 *
 * ROR was seeded from GRID, so the mapping is one to one and the GRID id can be
 * added to the ORCID query without the user asking for it. It is not cosmetic:
 * for Karolinska, `ror-org-id` alone finds 4,206 accounts and `ror-org-id OR
 * grid-org-id` finds 5,318. ORCID indexes the two separately and an account
 * declaring the institution may sit under either.
 *
 * RINGGOLD is the bigger gap still, but ROR does not carry Ringgold ids, and a
 * Ringgold id is coarser than a ROR one: 27106 covers both Karolinska
 * Institutet and Karolinska University Hospital. So that one stays a field the
 * user fills in deliberately, never a silent addition.
 */
export function gridId(record) {
  const e = (record?.external_ids ?? []).find((x) => x.type === 'grid');
  return e?.preferred ?? e?.all?.[0] ?? null;
}

/**
 * Resolve one ROR id to the facts the search uses: its registered names and its
 * GRID id. Returns empties rather than throwing when ROR cannot be reached: the
 * search still runs, it just falls back to matching on the ROR id alone, which
 * is the behaviour it had before this existed.
 */
export async function fetchRorFacts(id, deps = {}) {
  const get = deps.get ?? getJson;
  const record = await get(`${ROR_API}/${encodeURIComponent(id)}`, deps);
  return { id, names: usableNames(record), grid: gridId(record) };
}
