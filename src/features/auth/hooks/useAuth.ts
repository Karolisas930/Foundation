import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export interface AuthProfile {
  id: string;
  account_type: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

interface AuthContextValue {
  user: User | null;
  profile: AuthProfile | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadProfile(uid: string) {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("id, account_type, display_name, avatar_url")
          .eq("id", uid)
          .maybeSingle();
        if (!mounted) return;
        setProfile((data as AuthProfile | null) ?? null);
      } catch (err) {
        console.warn("useAuth loadProfile failed:", err);
        if (mounted) setProfile(null);
      }
    }

    // Register the listener FIRST so we never miss an event during bootstrap.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      const nextUser = session?.user ?? null;
      setUser(nextUser);
      setAccessToken(session?.access_token ?? null);
      setIsLoading(false);
      if (nextUser) {
        void loadProfile(nextUser.id);
      } else {
        setProfile(null);
      }
    });

    void supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (!mounted) return;
        const sessUser = session?.user ?? null;
        setUser(sessUser);
        setAccessToken(session?.access_token ?? null);
        setIsLoading(false);
        if (sessUser) void loadProfile(sessUser.id);
      })
      .catch((err) => {
        console.warn("useAuth getSession failed:", err);
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut().catch(() => undefined);
    setUser(null);
    setProfile(null);
    setAccessToken(null);
    setIsLoading(false);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      accessToken,
      isAuthenticated: !!user,
      isLoading,
      signOut,
    }),
    [user, profile, accessToken, isLoading, signOut],
  );

  return createElement(AuthContext.Provider, { value }, children);
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
