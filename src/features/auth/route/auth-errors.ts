export function describeAuthError(err: unknown, fallback: string): string {
  if (err && typeof err === "object" && "message" in err) {
    const msg = String((err as { message: unknown }).message ?? "");
    if (/failed to fetch|networkerror|load failed/i.test(msg)) {
      return "Couldn't reach the sign-in service. Check your connection and try again.";
    }
    if (/not connected|not configured/i.test(msg)) {
      return "Sign-in is unavailable — Lovable Cloud isn't connected yet.";
    }
    return msg || fallback;
  }
  return fallback;
}
