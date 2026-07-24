/**
 * Deprecated demo-session shim.
 *
 * The app previously carried a `localStorage`-backed mock login used by the
 * preview flow. Authentication now runs exclusively through Supabase
 * (`useAuth` + `supabase.auth.onAuthStateChange`). These functions remain
 * as no-ops so legacy call sites still compile; they intentionally do
 * nothing and never report a signed-in user.
 */
export type DemoUser = { email?: string; name?: string };

export function getDemoUser(): DemoUser | null {
  return null;
}

export function setDemoUser(_user: DemoUser): void {
  /* no-op — real auth flows go through supabase.auth */
}

export function clearDemoUser(): void {
  /* no-op */
}

export function subscribeDemoUser(_cb: () => void): () => void {
  return () => undefined;
}
