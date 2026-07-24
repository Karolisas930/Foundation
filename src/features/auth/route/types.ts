export type Mode = "signin" | "signup" | "forgot";

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
