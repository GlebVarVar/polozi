"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { account, type AuthResponse } from "./api";
import {
  getProgressBlob,
  mergeProgressBlobs,
  replaceProgress,
  subscribeProgress,
  type ProgressBlob,
} from "./storage";

interface AuthUser {
  email: string;
}

export type SyncStatus = "idle" | "syncing" | "error";

interface Ctx {
  user: AuthUser | null;
  status: SyncStatus;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const KEY = "polozi.auth";
const AuthContext = createContext<Ctx | null>(null);

function loadStored(): AuthResponse | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AuthResponse) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<SyncStatus>("idle");
  const tokenRef = useRef<string | null>(null);
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearSession = useCallback(() => {
    tokenRef.current = null;
    setUser(null);
    if (typeof window !== "undefined") localStorage.removeItem(KEY);
  }, []);

  const pushNow = useCallback(async () => {
    const token = tokenRef.current;
    if (!token) return;
    setStatus("syncing");
    try {
      await account.putProgress<ProgressBlob>(token, getProgressBlob());
      setStatus("idle");
    } catch (e) {
      if ((e as Error).message === "unauthorized") clearSession();
      setStatus("error");
    }
  }, [clearSession]);

  const schedulePush = useCallback(() => {
    if (!tokenRef.current) return;
    if (pushTimer.current) clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(() => void pushNow(), 800);
  }, [pushNow]);

  // Pull server progress, merge with local, write back both directions.
  const sync = useCallback(
    async (token: string) => {
      setStatus("syncing");
      try {
        const server = await account.getProgress<Partial<ProgressBlob>>(token);
        const serverBlob: ProgressBlob = {
          attempts: server?.attempts ?? [],
          exams: server?.exams ?? [],
        };
        const merged = mergeProgressBlobs(getProgressBlob(), serverBlob);
        replaceProgress(merged);
        await account.putProgress<ProgressBlob>(token, merged);
        setStatus("idle");
      } catch (e) {
        if ((e as Error).message === "unauthorized") clearSession();
        setStatus("error");
      }
    },
    [clearSession],
  );

  // Restore a saved session on load and sync it.
  useEffect(() => {
    const stored = loadStored();
    if (stored?.token) {
      tokenRef.current = stored.token;
      setUser({ email: stored.email });
      void sync(stored.token);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced push of local changes while signed in.
  useEffect(() => {
    const unsub = subscribeProgress(schedulePush);
    return () => {
      unsub();
      if (pushTimer.current) clearTimeout(pushTimer.current);
    };
  }, [schedulePush]);

  const authenticate = useCallback(
    async (
      fn: (email: string, password: string) => Promise<AuthResponse>,
      email: string,
      password: string,
    ) => {
      const res = await fn(email, password); // throws with server message on failure
      tokenRef.current = res.token;
      setUser({ email: res.email });
      if (typeof window !== "undefined")
        localStorage.setItem(KEY, JSON.stringify(res));
      await sync(res.token);
    },
    [sync],
  );

  const login = useCallback(
    (email: string, password: string) =>
      authenticate(account.login, email, password),
    [authenticate],
  );
  const register = useCallback(
    (email: string, password: string) =>
      authenticate(account.register, email, password),
    [authenticate],
  );
  const logout = useCallback(() => {
    clearSession();
    setStatus("idle");
  }, [clearSession]);

  return (
    <AuthContext.Provider value={{ user, status, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
