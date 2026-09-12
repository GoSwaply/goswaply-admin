"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { loginSchema, type LoginInput } from "@/schemas/auth.schema";
import { authApi } from "@/lib/api/auth-api";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";

export function LoginForm() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [showPw, setShowPw] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setServerError(null);
    try {
      const res = await authApi.login(data.email, data.password);
      setAuth(res.accessToken, res.user);
      router.push("/dashboard");
    } catch (err) {
      // Still never says whether the email or the password was wrong — that
      // would confirm which accounts exist. But a request that never reached
      // the API is not a credential problem, and saying so cost real time:
      // a CORS rejection looked exactly like a wrong password.
      const message =
        err instanceof TypeError
          ? "Could not reach the API. Check your connection, or that this site is allowed to call it."
          : err instanceof Error && /\b(404|not found)\b/i.test(err.message)
            ? "The API address looks wrong. Check NEXT_PUBLIC_API_BASE_URL for this deployment."
            : "Login failed. Please check your credentials and try again.";
      setServerError(message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
            <ArrowLeftRight className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Swapply Admin</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Secure operational access for authorized administrators.
          </p>
        </div>

        <Card className="shadow-md">
          <CardHeader className="pb-4">
            <h2 className="text-base font-semibold">Sign in to your account</h2>
          </CardHeader>
          <CardContent>
            {serverError && (
              <div
                role="alert"
                className="mb-4 rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive"
              >
                {serverError}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="admin@swapply.com"
                  aria-describedby={errors.email ? "email-error" : undefined}
                  {...register("email")}
                />
                {errors.email && (
                  <p id="email-error" className="text-xs text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPw ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    aria-describedby={errors.password ? "pw-error" : undefined}
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showPw ? "Hide password" : "Show password"}
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p id="pw-error" className="text-xs text-destructive">{errors.password.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-[11px] text-muted-foreground">
          Access is monitored. Unauthorized use is prohibited.
        </p>
      </div>
    </div>
  );
}
