"use client";

import { useRouter } from "next/navigation";
import { LogOut, Shield, Menu, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/stores/auth-store";
import { authApi } from "@/lib/api/auth-api";
import { useUiStore } from "@/stores/ui-store";
import { toast } from "sonner";

export function Topbar({ title }: { title?: string }) {
  const { user, clearAuth } = useAuthStore();
  const { toggleSidebar } = useUiStore();
  const router = useRouter();

  const handleLogout = async () => {
    await authApi.logout();
    clearAuth();
    toast.info("You have been logged out.");
    router.push("/login");
  };

  return (
    <header className="h-14 flex items-center justify-between border-b bg-card px-4 shrink-0">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
        >
          <Menu className="h-4 w-4" />
        </Button>
        {title && <h1 className="text-sm font-semibold">{title}</h1>}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Shield className="h-3.5 w-3.5 text-green-600" />
          <span className="hidden sm:inline">Session secured</span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2">
              <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
                {user?.email?.[0]?.toUpperCase() ?? "A"}
              </div>
              <div className="hidden sm:flex flex-col items-start">
                <span className="text-xs font-medium truncate max-w-[120px]">{user?.email}</span>
                <Badge
                  variant={user?.role === "SUPER_ADMIN" ? "default" : "secondary"}
                  className="text-[10px] px-1.5 py-0 h-4"
                >
                  {user?.role === "SUPER_ADMIN" ? "Super Admin" : "Support"}
                </Badge>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-2 py-1.5">
              <p className="text-xs font-medium">{user?.email}</p>
              <p className="text-xs text-muted-foreground">{user?.role}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
              <LogOut className="h-4 w-4 mr-2" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
