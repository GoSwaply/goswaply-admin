import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Secure admin access for Swapply administrators.",
};

export default function LoginPage() {
  return <LoginForm />;
}
