import { ApiError } from "./errors";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

let accessToken: string | null = null;

// Refresh lock to prevent concurrent refresh races
let isRefreshing = false;
let refreshQueue: Array<(token: string | null) => void> = [];

export function setClientToken(token: string | null) {
  accessToken = token;
}

export function clearClientToken() {
  accessToken = null;
}

async function runRefresh(): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { accessToken: string; user: unknown };
    return data.accessToken ?? null;
  } catch {
    return null;
  }
}

async function refreshTokenOnce(): Promise<string | null> {
  if (isRefreshing) {
    return new Promise((resolve) => {
      refreshQueue.push(resolve);
    });
  }

  isRefreshing = true;
  const newToken = await runRefresh();
  isRefreshing = false;

  refreshQueue.forEach((cb) => cb(newToken));
  refreshQueue = [];

  return newToken;
}

function buildHeaders(token: string | null): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

async function parseResponse<T>(res: Response): Promise<T> {
  const contentType = res.headers.get("Content-Type") ?? "";
  if (contentType.includes("application/json")) {
    return res.json() as Promise<T>;
  }
  const text = await res.text();
  return text as unknown as T;
}

async function handleError(res: Response): Promise<never> {
  let code = "UNKNOWN_ERROR";
  let message = "An unexpected error occurred.";
  let details: unknown = undefined;

  try {
    const body = (await res.json()) as {
      code?: string;
      message?: string;
      details?: unknown;
    };
    code = body.code ?? code;
    message = body.message ?? message;
    details = body.details;
  } catch {
    message = res.statusText || message;
  }

  throw new ApiError(res.status, code, message, details);
}

export async function req<T>(
  path: string,
  options: RequestInit = {},
  retry = true
): Promise<T> {
  const token = accessToken;
  const url = `${API_BASE}${path}`;

  const res = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      ...buildHeaders(token),
      ...(options.headers as Record<string, string> | undefined),
    },
  });

  if (res.status === 401 && retry) {
    const newToken = await refreshTokenOnce();

    if (!newToken) {
      clearClientToken();
      // Lazy import to avoid circular dep with store
      const { useAuthStore } = await import("@/stores/auth-store");
      useAuthStore.getState().clearAuth();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      throw new ApiError(401, "UNAUTHORIZED", "Your session expired. Please log in again.");
    }

    setClientToken(newToken);
    // Update store token
    const { useAuthStore } = await import("@/stores/auth-store");
    useAuthStore.getState().setAccessToken(newToken);

    return req<T>(path, options, false);
  }

  if (!res.ok) {
    await handleError(res);
  }

  return parseResponse<T>(res);
}

export function get<T>(path: string, options?: RequestInit) {
  return req<T>(path, { ...options, method: "GET" });
}

export function post<T>(path: string, body?: unknown, options?: RequestInit) {
  return req<T>(path, {
    ...options,
    method: "POST",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

export function patch<T>(path: string, body?: unknown, options?: RequestInit) {
  return req<T>(path, {
    ...options,
    method: "PATCH",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

export function put<T>(path: string, body?: unknown, options?: RequestInit) {
  return req<T>(path, {
    ...options,
    method: "PUT",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

export function del<T>(path: string, options?: RequestInit) {
  return req<T>(path, { ...options, method: "DELETE" });
}
