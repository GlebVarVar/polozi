"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { api, getToken, setToken } from "./api";

type AuthCtx = {
  authed: boolean;
  ready: boolean;
  /** Returns whether a TOTP code is still required to finish signing in. */
  login: (
    username: string,
    password: string,
  ) => Promise<{ requires2fa: boolean }>;
  /** Complete a 2FA-gated login with a TOTP code. */
  verify2fa: (code: string) => Promise<void>;
  logout: () => void;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authed, setAuthed] = useState(false);
  const [ready, setReady] = useState(false);
  const mfaToken = useRef<string | null>(null);

  useEffect(() => {
    setAuthed(!!getToken());
    setReady(true);
  }, []);

  const login = async (username: string, password: string) => {
    const res = await api.login(username, password);
    if (res.requires2fa && res.mfaToken) {
      mfaToken.current = res.mfaToken;
      return { requires2fa: true };
    }
    if (res.token) {
      setToken(res.token);
      setAuthed(true);
    }
    return { requires2fa: false };
  };

  const verify2fa = async (code: string) => {
    if (!mfaToken.current) throw new Error("No pending sign-in");
    const res = await api.loginVerify2fa(mfaToken.current, code);
    if (res.token) {
      setToken(res.token);
      setAuthed(true);
      mfaToken.current = null;
    }
  };

  const logout = () => {
    setToken(null);
    setAuthed(false);
    mfaToken.current = null;
  };

  return (
    <Ctx.Provider value={{ authed, ready, login, verify2fa, logout }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
