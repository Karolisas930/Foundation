export type Mode = "signin" | "signup" | "forgot";

/** Which registration flow the person came from — decides the landing dashboard. */
export type SignupSector = "homeowner" | "handyman" | "business" | "architect";

const SECTORS: readonly string[] = ["homeowner", "handyman", "business", "architect"];

export function isSector(value: unknown): value is SignupSector {
  return typeof value === "string" && SECTORS.includes(value);
}

/**
 * Result of a password sign-up.
 * - "confirm-email": account created, Supabase returned NO session because the
 *   address must be confirmed first. The UI must stay put and tell the user to
 *   check their inbox — navigating to a protected dashboard here is what caused
 *   the "home page for a second, then a blank screen" bug.
 * - "signed-in": confirmations are disabled, a session exists, we may navigate.
 * - "error": nothing happened, a toast was already shown.
 */
export type SignUpResult = "confirm-email" | "signed-in" | "error";

export type BusyKey =
  | null
  | "google"
  | "apple"
  | "password"
  | "magic"
  | "signup"
  | "forgot-email"
  | "forgot-sms"
  | "verify-sms"
  | "update-pw";
