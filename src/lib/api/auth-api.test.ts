import { afterEach, describe, expect, it, vi } from "vitest";
import { authApi } from "./auth-api";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("authApi.login", () => {
  it("preserves the backend message and status for rate-limited logins", async () => {
    const message = "Too many requests. Please wait a moment and try again.";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ statusCode: 429, message }), {
          status: 429,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    await expect(authApi.login("admin@example.com", "password")).rejects.toMatchObject({
      name: "AuthApiError",
      statusCode: 429,
      message,
    });
  });
});
