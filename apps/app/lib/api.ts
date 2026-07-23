import type {
  Category,
  Question,
  Review,
  School,
  SchoolDetail,
} from "./types";

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`API ${path} -> ${res.status}`);
  return res.json() as Promise<T>;
}

export interface AuthResponse {
  token: string;
  email: string;
}

async function authed<T>(
  path: string,
  token: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...init?.headers,
    },
  });
  if (res.status === 401) throw new Error("unauthorized");
  if (!res.ok) throw new Error(`API ${path} -> ${res.status}`);
  return res.json() as Promise<T>;
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let message = `API ${path} -> ${res.status}`;
    try {
      const data = (await res.json()) as { error?: string };
      if (data?.error) message = data.error;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

export const account = {
  register: (email: string, password: string) =>
    postJson<AuthResponse>("/api/account/register", { email, password }),
  login: (email: string, password: string) =>
    postJson<AuthResponse>("/api/account/login", { email, password }),
  getProgress: <T>(token: string) => authed<T>("/api/account/progress", token),
  putProgress: <T>(token: string, data: T) =>
    authed<T>("/api/account/progress", token, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
};

export const api = {
  categories: () => get<Category[]>("/api/categories"),
  questions: (params?: { categoryId?: string; difficulty?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.categoryId) q.set("categoryId", params.categoryId);
    if (params?.difficulty) q.set("difficulty", String(params.difficulty));
    if (params?.limit) q.set("limit", String(params.limit));
    const qs = q.toString();
    return get<Question[]>(`/api/questions${qs ? `?${qs}` : ""}`);
  },
  question: (id: string) => get<Question>(`/api/questions/${id}`),
  schools: (city?: string) =>
    get<School[]>(`/api/schools${city ? `?city=${encodeURIComponent(city)}` : ""}`),
  cities: () => get<string[]>("/api/cities"),
  school: (id: string) => get<SchoolDetail>(`/api/schools/${id}`),
  addReview: async (
    schoolId: string,
    body: { rating: number; comment: string; authorName: string },
  ): Promise<Review> => {
    const res = await fetch(`${API_BASE}/api/schools/${schoolId}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`addReview -> ${res.status}`);
    return res.json() as Promise<Review>;
  },
};
