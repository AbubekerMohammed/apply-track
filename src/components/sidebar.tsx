"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Briefcase,
  Target,
  Users,
  Settings,
  LogOut,
  Compass,
  Menu,
  X,
  UserCheck,
  Radio,
} from "lucide-react";
import { ThemeToggle } from "./theme-toggle";

const NAV_ITEMS = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    badge: "⌘1",
  },
  {
    name: "Applications",
    href: "/applications",
    icon: Briefcase,
    badge: "⌘2",
  },
  {
    name: "Targets & Referrals",
    href: "/targets",
    icon: Target,
    badge: "⌘3",
  },
  {
    name: "Contacts",
    href: "/contacts",
    icon: Users,
    badge: "⌘4",
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
    badge: "⌘5",
  },
];

export function Sidebar({ user }: { user?: { name?: string | null; email?: string | null } }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const currentUser = user || session?.user;
  const displayName = currentUser?.name || currentUser?.email?.split("@")[0] || "User";
  const displayEmail = currentUser?.email || "user@example.com";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const navContent = (
    <div className="flex flex-col h-full bg-[#FAFAFC] dark:bg-[#0C0E12] border-r border-slate-200/90 dark:border-white/[0.07] text-slate-900 dark:text-slate-100 font-sans selection:bg-slate-800 selection:text-white">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200/80 dark:border-white/[0.06]">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 group"
          onClick={() => setMobileOpen(false)}
        >
          {/* Bespoke Telemetry Mark */}
          <div className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-950 flex items-center justify-center font-mono font-bold text-xs tracking-tighter shadow-xs group-hover:scale-105 transition-transform">
            <span>AT</span>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-white">
                ApplyTrack
              </span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-slate-200/70 dark:bg-white/10 text-slate-600 dark:text-slate-400">
                PRO
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
              Career Pipeline Deck
            </span>
          </div>
        </Link>

        <div className="md:hidden">
          <button
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-5 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 mb-2 text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
          Navigation
        </div>
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group ${
                isActive
                  ? "bg-slate-900 dark:bg-white/[0.08] text-white dark:text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-white/[0.04] hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive
                      ? "text-white dark:text-white"
                      : "text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300"
                  }`}
                />
                <span className="truncate">{item.name}</span>
              </div>
              <span
                className={`text-[10px] font-mono transition-opacity ${
                  isActive
                    ? "text-slate-300 dark:text-slate-400 opacity-100"
                    : "text-slate-400 dark:text-slate-600 opacity-0 group-hover:opacity-100"
                }`}
              >
                {item.badge}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Account & System Footer */}
      <div className="p-3 border-t border-slate-200/80 dark:border-white/[0.06] space-y-2">
        <div className="flex items-center justify-between px-2 py-1">
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400 dark:text-slate-500">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Connected</span>
          </div>
          <ThemeToggle />
        </div>

        <div className="p-2.5 rounded-xl bg-white dark:bg-[#12151B] border border-slate-200/80 dark:border-white/[0.06] flex items-center justify-between gap-2.5 shadow-2xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 shrink-0 rounded-lg bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-slate-200 flex items-center justify-center font-mono font-bold text-xs">
              {initials || "US"}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                {displayName}
              </p>
              <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500 truncate">
                {displayEmail}
              </p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            title="Sign out"
            aria-label="Sign out"
            className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Top Bar */}
      <header className="md:hidden sticky top-0 z-40 flex items-center justify-between px-4 py-3 bg-[#FAFAFC] dark:bg-[#0C0E12] border-b border-slate-200/90 dark:border-white/[0.07]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-950 flex items-center justify-center font-mono font-bold text-xs">
            AT
          </div>
          <span className="font-bold text-slate-900 dark:text-white text-sm">
            ApplyTrack
          </span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Open navigation menu"
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-white/[0.06]"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs md:hidden"
          onClick={() => setMobileOpen(false)}
        >
          <div
            className="fixed inset-y-0 left-0 w-72 z-50 shadow-2xl animate-in slide-in-from-left duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {navContent}
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-60 shrink-0 h-screen sticky top-0">
        {navContent}
      </aside>
    </>
  );
}
