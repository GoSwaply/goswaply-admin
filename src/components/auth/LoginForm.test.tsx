import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthApiError, authApi } from "@/lib/api/auth-api";
import { LoginForm } from "./LoginForm";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/lib/api/auth-api", () => ({
  AuthApiError: class AuthApiError extends Error {
    constructor(
      readonly statusCode: number,
      message: string,
    ) {
      super(message);
    }
  },
  authApi: { login: vi.fn() },
}));

vi.mock("@/stores/auth-store", () => ({
  useAuthStore: () => ({ setAuth: vi.fn() }),
}));

describe("LoginForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows the backend message when login is rate limited", async () => {
    const message = "Too many requests. Please wait a moment and try again.";
    vi.mocked(authApi.login).mockRejectedValue(new AuthApiError(429, message));

    render(<LoginForm />);
    fireEvent.change(screen.getByLabelText("Email address"), {
      target: { value: "admin@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(message);
    });
  });
});
