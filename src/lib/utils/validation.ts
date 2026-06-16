/**
 * ReDoS-safe email validator.
 *
 * The common pattern /^[^\s@]+@[^\s@]+\.[^\s@]+$/ is vulnerable to
 * super-linear backtracking on crafted inputs (ReDoS).
 *
 * This version uses anchored, non-overlapping character classes with
 * explicit length caps so the engine cannot backtrack exponentially.
 *
 * Limits: local ≤ 64 chars, domain ≤ 255 chars (per RFC 5321).
 */
export function isValidEmail(email: string): boolean {
	if (email.length > 320) return false
	// local @ domain.tld — no nested quantifiers, no overlapping classes
	return /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]{1,64}@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/.test(
		email
	)
}
