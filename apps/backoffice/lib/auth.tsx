"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { api, getToken, setToken } from "./api";

type AuthCtx = {
  authed: boolean;
  ready: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authed, setAuthed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setAuthed(!!getToken());
    setReady(true);
  }, []);

  const login = async (username: string, password: string) => {
    const { token } = await api.login(username, password);
    setToken(token);
    setAuthed(true);
  };

  const logout = () => {
    setToken(null);
    setAuthed(false);
  };

  return (
    <Ctx.Provider value={{ authed, ready, login, logout }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
