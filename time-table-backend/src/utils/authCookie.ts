import { DEFAULT_JWT_EXPIRES_IN } from "../constants/auth";
import { jwtExpiresInToMs } from "./jwtExpiresMs";

export function sessionCookieMaxAgeMs(): number {
  const expiresIn = process.env.JWT_EXPIRES_IN?.trim() || DEFAULT_JWT_EXPIRES_IN;
  return jwtExpiresInToMs(expiresIn);
}
