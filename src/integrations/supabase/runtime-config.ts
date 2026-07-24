/**
 * Runtime Supabase config — lets users configure their own Supabase project
 * URL + publishable key from the in-app setup page without hardcoding values
 * or rebuilding. Values are stored in localStorage and override the
 * build-time VITE_SUPABASE_* env vars when present.
 *
 * SECURITY: Only accepts publishable/anon keys (safe to expose in the
 * browser). Never store service-role keys here.
 */

const STORAGE_KEY = "hw:supabase-runtime-config::v1";

export type SupabaseRuntimeConfig = {
  url: string;
  publishableKey: string;
};

export function loadSupabaseRuntimeConfig(): SupabaseRuntimeConfig | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SupabaseRuntimeConfig>;
    if (!parsed?.url || !parsed?.publishableKey) return null;
    return { url: parsed.url, publishableKey: parsed.publishableKey };
  } catch {
    return null;
  }
}

export function saveSupabaseRuntimeConfig(cfg: SupabaseRuntimeConfig): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
}

export function clearSupabaseRuntimeConfig(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

export function isValidSupabaseUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "https:" && u.hostname.length > 0;
  } catch {
    return false;
  }
}

export function isPublishableKeyShape(key: string): boolean {
  // Accept either the new sb_publishable_* keys or legacy JWT anon keys.
  return key.startsWith("sb_publishable_") || key.split(".").length === 3;
}
