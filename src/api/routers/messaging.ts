// Messaging router skeleton — protected by the shared rate limiter.
//
// Apply at the entry of any message-send handler to shield against bot spam:
//
//   import { enforceRateLimit, RATE_LIMITS } from "@/api/rate-limit";
//   import { sanitizeText } from "@/lib/sanitize";
//
//   export async function handleSendMessage(request: Request, userId: string) {
//     enforceRateLimit(RATE_LIMITS.messaging, request, userId);
//     const body = await request.json();
//     const clean = {
//       subject: sanitizeText(body.subject, { maxLength: 200 }),
//       body: sanitizeText(body.body, { maxLength: 5000 }),
//     };
//     // ... persist `clean`
//   }
export {};
