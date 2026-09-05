import { post } from "./client";
import type { LoginResponse, RefreshResponse } from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export const authApi = {
  async login(email: string, password: string): Promise<LoginResponse> {
    // Direct fetch for login to avoid attaching stale tokens
    const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      // Never log the body with credentials
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      let message = "Login failed. Please check your credentials.";
      try {
        const body = (await res.json()) as { message?: string };
        if (body.message) message = body.message;
      } catch {}
      throw new Error(message);
    }

    return res.json() as Promise<LoginResponse>;
  },

  async refresh(): Promise<RefreshResponse | null> {
    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) return null;
      return res.json() as Promise<RefreshResponse>;
    } catch {
      return null;
    }
  },

  async logout(): Promise<void> {
    await post("/api/v1/auth/logout").catch(() => {});
  },
};
