// TODO: implement auth.ts
//
// Rate-limit template — apply at the entry of any auth handler:
//
//   import { enforceRateLimit, RATE_LIMITS } from "@/api/rate-limit";
//
//   export async function handleLogin(request: Request) {
//     enforceRateLimit(RATE_LIMITS.auth, request);
//     // ... continue with credential verification
//   }
//
//   export async function handlePasswordReset(request: Request) {
//     enforceRateLimit(RATE_LIMITS.passwordReset, request);
//     // ... continue
//   }
export {};
