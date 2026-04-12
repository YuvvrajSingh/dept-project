/**
 * Parse values like `7d`, `12h`, `30m`, `900s` for Set-Cookie maxAge (milliseconds).
 * Falls back to 7 days if the pattern is not recognized.
 */
export function jwtExpiresInToMs(expiresIn: string): number {
  const raw = expiresIn.trim();
  const m = /^(\d+)([dhms])$/i.exec(raw);
  if (!m) {
    return 7 * 24 * 60 * 60 * 1000;
  }
  const n = Number(m[1]);
  const unit = m[2].toLowerCase();
  const mult =
    unit === "d" ? 86_400_000 : unit === "h" ? 3_600_000 : unit === "m" ? 60_000 : 1000;
  return n * mult;
}
