"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, ArrowLeftRight, RefreshCw, Bitcoin, Gift, ScanFace,
  ShieldAlert, Briefcase, ScrollText, Settings2, DollarSign, Tag, Wrench,
  Flag, MonitorOff, Megaphone, Bell, Activity, Webhook, Terminal, Lock,
  ChevronDown, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/hooks/use-permissions";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useState } from "react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  superAdminOnly?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
    ],
  },
  {
    title: "Users",
    items: [
      { label: "Users", href: "/users", icon: <Users className="h-4 w-4" /> },
    ],
  },
  {
    title: "Transactions",
    items: [
      { label: "Transactions", href: "/transactions", icon: <ArrowLeftRight className="h-4 w-4" /> },
      { label: "VAS Reconciliation", href: "/transactions/reconciliation", icon: <RefreshCw className="h-4 w-4" /> },
    ],
  },
  {
    title: "Exchange & KYC",
    items: [
      { label: "Crypto Requests", href: "/exchange/crypto", icon: <Bitcoin className="h-4 w-4" /> },
      { label: "Gift Card Requests", href: "/exchange/gift-cards", icon: <Gift className="h-4 w-4" /> },
      { label: "KYC Queue", href: "/kyc", icon: <ScanFace className="h-4 w-4" /> },
    ],
  },
  {
    title: "Compliance",
    items: [
      { label: "Fraud Rules", href: "/compliance/fraud-rules", icon: <ShieldAlert className="h-4 w-4" /> },
      { label: "Cases", href: "/compliance/cases", icon: <Briefcase className="h-4 w-4" /> },
      { label: "Audit Log", href: "/compliance/audit-log", icon: <ScrollText className="h-4 w-4" /> },
    ],
  },
  {
    title: "Configuration",
    items: [
      { label: "Margins", href: "/config/margins", icon: <Settings2 className="h-4 w-4" />, superAdminOnly: true },
      { label: "Fee Rules", href: "/config/fee-rules", icon: <DollarSign className="h-4 w-4" />, superAdminOnly: true },
      { label: "Biller Pricing", href: "/config/biller-pricing", icon: <Tag className="h-4 w-4" />, superAdminOnly: true },
      { label: "Feature Flags", href: "/config/feature-flags", icon: <Flag className="h-4 w-4" />, superAdminOnly: true },
    ],
  },
  {
    title: "System",
    items: [
      { label: "Maintenance", href: "/system/maintenance", icon: <MonitorOff className="h-4 w-4" />, superAdminOnly: true },
      { label: "Banners", href: "/system/banners", icon: <Megaphone className="h-4 w-4" />, superAdminOnly: true },
      { label: "Notifications", href: "/system/notifications", icon: <Bell className="h-4 w-4" />, superAdminOnly: true },
    ],
  },
  {
    title: "Integrations",
    items: [
      { label: "Gateway Health", href: "/integrations/health", icon: <Activity className="h-4 w-4" /> },
      { label: "Webhooks", href: "/integrations/webhooks", icon: <Webhook className="h-4 w-4" /> },
    ],
  },
  {
    title: "Logs",
    items: [
      { label: "Server Logs", href: "/logs", icon: <Terminal className="h-4 w-4" />, superAdminOnly: true },
    ],
  },
];

interface SidebarProps {
  collapsed?: boolean;
}

export function Sidebar({ collapsed }: SidebarProps) {
  const pathname = usePathname();
  const { isSuperAdmin } = usePermissions();
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  const toggleSection = (title: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  };

  return (
    <aside className="flex h-full flex-col bg-sidebar border-r border-sidebar-border">
      {/* Logo */}
      <div className="flex h-14 items-center px-4 border-b border-sidebar-border shrink-0">
        {!collapsed ? (
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-sidebar-primary flex items-center justify-center">
              <ArrowLeftRight className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-sidebar-accent-foreground text-sm tracking-tight">
              Swapply Admin
            </span>
          </div>
        ) : (
          <div className="h-7 w-7 rounded-lg bg-sidebar-primary flex items-center justify-center mx-auto">
            <ArrowLeftRight className="h-4 w-4 text-white" />
          </div>
        )}
      </div>

      <ScrollArea className="flex-1">
        <nav className="py-3 px-2 space-y-1" aria-label="Admin navigation">
          {NAV_SECTIONS.map((section) => {
            const sectionCollapsed = collapsedSections.has(section.title);
            return (
              <div key={section.title} className="mb-1">
                {!collapsed && (
                  <button
                    onClick={() => toggleSection(section.title)}
                    className="flex w-full items-center justify-between px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/50 hover:text-sidebar-foreground/70 transition-colors"
                  >
                    {section.title}
                    {sectionCollapsed ? (
                      <ChevronRight className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )}
                  </button>
                )}

                {!sectionCollapsed && (
                  <div className="space-y-0.5">
                    {section.items.map((item) => {
                      const isActive =
                        pathname === item.href ||
                        (item.href !== "/dashboard" && pathname.startsWith(item.href));
                      const isRestricted = item.superAdminOnly && !isSuperAdmin;

                      const linkClasses = cn(
                        "group flex items-center gap-2.5 rounded-md px-2 py-2 text-sm transition-colors",
                        isActive
                          ? "bg-sidebar-primary/20 text-sidebar-primary font-medium"
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        isRestricted && "opacity-60"
                      );

                      if (collapsed) {
                        return (
                          <Tooltip key={item.href} delayDuration={200}>
                            <TooltipTrigger asChild>
                              <Link href={item.href} className={cn(linkClasses, "justify-center")}>
                                {item.icon}
                              </Link>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                              {item.label}
                              {isRestricted && " (Super Admin only)"}
                            </TooltipContent>
                          </Tooltip>
                        );
                      }

                      return (
                        <Link key={item.href} href={item.href} className={linkClasses}>
                          {item.icon}
                          <span className="flex-1">{item.label}</span>
                          {isRestricted && (
                            <Lock className="h-3 w-3 opacity-50 shrink-0" />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </ScrollArea>
    </aside>
  );
}
