/** HTTP-only cookie carrying the signed JWT (single-session model; no refresh token in v1). */
export const SESSION_COOKIE_NAME = "tt_session";

/**
 * v1: one JWT in an http-only cookie. Logout clears the cookie; invalidation before expiry
 * would require a server-side session denylist (not implemented). Tune via JWT_EXPIRES_IN.
 */
export const DEFAULT_JWT_EXPIRES_IN = "7d";
