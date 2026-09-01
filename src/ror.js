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

import { getJson } from './orcid.js?v=3';

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

/** The child organisations ROR records for this id, as bare ROR ids. */
export function childIds(record) {
  return (record?.relationships ?? [])
    .filter((r) => r.type === 'child')
    .map((r) => String(r.id ?? '').replace(/^https?:\/\/ror\.org\//, ''))
    .filter(Boolean);
}

/**
 * Resolve one ROR id to its usable names. Returns an empty list rather than
 * throwing when ROR cannot be reached: the search still runs, it just matches on
 * the ROR id alone, which is the behaviour it had before this existed.
 */
export async function fetchRorNames(id, deps = {}) {
  const get = deps.get ?? getJson;
  const record = await get(`${ROR_API}/${encodeURIComponent(id)}`, deps);
  return usableNames(record);
}
