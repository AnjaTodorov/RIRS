import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  createClient,
  type SupabaseClient,
  type Session,
} from "@supabase/supabase-js";

export type Profile = {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  phoneNumber: string;
  role: "SEEKER" | "ADVERTISER" | "ADMIN";
};
export class ApiError extends Error {
  constructor(
    message: string,
    public fields: Record<string, string> = {},
  ) {
    super(message);
  }
}
type AuthState = {
  client: SupabaseClient | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  error: string;
  reload(): Promise<void>;
};
const Context = createContext<AuthState>(null!);
export function useSession() {
  return useContext(Context);
}
export async function request<T = any>(
  path: string,
  token?: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (options.body && !(options.body instanceof FormData))
    headers.set("Content-Type", "application/json");
  const response = await fetch(`/api${path}`, { ...options, headers });
  const body = await response.json();
  if (!response.ok)
    throw new ApiError(body.message || "Zahteva ni uspela.", body.fields);
  return body;
}
export function SessionProvider({ children }: { children: ReactNode }) {
  const [client, setClient] = useState<SupabaseClient | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;
    request<{ url: string; key: string }>("/auth/config")
      .then(({ url, key }) => {
        if (!active) return;
        const auth = createClient(url, key, {
          auth: { detectSessionInUrl: false },
        });
        setClient(auth);
        unsubscribe = auth.auth.onAuthStateChange((_event, value) => {
          if (active) {
            setSession(value);
            if (!value) {
              setProfile(null);
              setLoading(false);
            }
          }
        }).data.subscription.unsubscribe;
      })
      .catch(() => {
        if (active) {
          setError("Povezava s strežnikom ni uspela.");
          setLoading(false);
        }
      });
    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);
  async function reload() {
    if (!session) {
      setProfile(null);
      return;
    }
    const user = await request<Profile>("/profile", session.access_token);
    setProfile(user);
  }
  useEffect(() => {
    let active = true;
    if (!session) return;
    setLoading(true);
    setError("");
    request<Profile>("/profile", session.access_token)
      .then((user) => {
        if (active) setProfile(user);
      })
      .catch((e) => {
        if (active) {
          setProfile(null);
          setError(e.message);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [session]);
  return (
    <Context.Provider
      value={{ client, session, profile, loading, error, reload }}
    >
      {children}
    </Context.Provider>
  );
}
