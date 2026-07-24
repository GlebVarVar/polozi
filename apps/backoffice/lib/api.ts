import type {
  Category,
  Question,
  QuestionInput,
  School,
  SchoolInput,
} from "./types";

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export const TOKEN_KEY = "polozi.admin.token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  auth = false,
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (res.status === 401) {
    setToken(null);
    throw new ApiError(401, "Unauthorized");
  }
  if (!res.ok) {
    let msg = `${res.status}`;
    try {
      const body = await res.json();
      msg = body.error ?? msg;
    } catch {
      /* ignore */
    }
    throw new ApiError(res.status, msg);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export interface LoginResult {
  token: string | null;
  requires2fa: boolean;
  mfaToken: string | null;
  twofaEnabled: boolean;
}

export const api = {
  login: (username: string, password: string) =>
    request<LoginResult>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
  loginVerify2fa: (mfaToken: string, code: string) =>
    request<LoginResult>("/api/auth/login/2fa", {
      method: "POST",
      headers: { Authorization: `Bearer ${mfaToken}` },
      body: JSON.stringify({ code }),
    }),

  // Two-factor auth (admin, requires an active session)
  twofaStatus: () =>
    request<{ enabled: boolean }>("/api/admin/2fa/status", {}, true),
  twofaSetup: () =>
    request<{ secret: string; otpauthUrl: string }>(
      "/api/admin/2fa/setup",
      { method: "POST" },
      true,
    ),
  twofaEnable: (code: string) =>
    request<{ enabled: boolean }>(
      "/api/admin/2fa/enable",
      { method: "POST", body: JSON.stringify({ code }) },
      true,
    ),
  twofaDisable: (code: string) =>
    request<{ enabled: boolean }>(
      "/api/admin/2fa/disable",
      { method: "POST", body: JSON.stringify({ code }) },
      true,
    ),

  // Categories
  listCategories: () => request<Category[]>("/api/categories"),
  createCategory: (c: Category) =>
    request<Category>("/api/admin/categories", {
      method: "POST",
      body: JSON.stringify(c),
    }, true),
  updateCategory: (id: string, c: Category) =>
    request<Category>(`/api/admin/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify(c),
    }, true),
  deleteCategory: (id: string) =>
    request<void>(`/api/admin/categories/${id}`, { method: "DELETE" }, true),

  // Questions
  listQuestions: (categoryId?: string) =>
    request<Question[]>(
      `/api/questions${categoryId ? `?categoryId=${categoryId}` : ""}`,
    ),
  createQuestion: (q: QuestionInput) =>
    request<Question>("/api/admin/questions", {
      method: "POST",
      body: JSON.stringify(q),
    }, true),
  updateQuestion: (id: string, q: QuestionInput) =>
    request<Question>(`/api/admin/questions/${id}`, {
      method: "PUT",
      body: JSON.stringify(q),
    }, true),
  deleteQuestion: (id: string) =>
    request<void>(`/api/admin/questions/${id}`, { method: "DELETE" }, true),

  // Schools
  listSchools: (city?: string) =>
    request<School[]>(`/api/schools${city ? `?city=${city}` : ""}`),
  createSchool: (s: SchoolInput) =>
    request<School>("/api/admin/schools", {
      method: "POST",
      body: JSON.stringify(s),
    }, true),
  updateSchool: (id: string, s: SchoolInput) =>
    request<School>(`/api/admin/schools/${id}`, {
      method: "PUT",
      body: JSON.stringify(s),
    }, true),
  deleteSchool: (id: string) =>
    request<void>(`/api/admin/schools/${id}`, { method: "DELETE" }, true),
};
