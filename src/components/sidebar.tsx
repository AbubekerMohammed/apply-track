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
  Sparkles,
  Menu,
  X,
  UserCheck,
} from "lucide-react";
import { ThemeToggle } from "./theme-toggle";

const NAV_ITEMS = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Applications",
    href: "/applications",
    icon: Briefcase,
  },
  {
    name: "Targets & Referrals",
    href: "/targets",
    icon: Target,
  },
  {
    name: "Contacts",
    href: "/contacts",
    icon: Users,
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
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
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 dark:border-slate-800">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 font-bold text-lg tracking-tight hover:opacity-90 transition-opacity"
          onClick={() => setMobileOpen(false)}
        >
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-blue-600 dark:text-blue-400 leading-none">
              ApplyTrack
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500 font-normal mt-0.5">
              Smart Job Tracker
            </span>
          </div>
        </Link>
        <div className="md:hidden">
          <button
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Workspace
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
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <Icon
                className={`w-5 h-5 transition-colors ${
                  isActive
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-slate-400 dark:text-slate-500"
                }`}
              />
              <span>{item.name}</span>
              {isActive && (
                <span className="ml-auto w-1.5 h-5 rounded-full bg-blue-600 dark:bg-blue-400" />
              )}
            </Link>
          );
        })}
      </div>

      {/* User & Settings Footer */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Appearance
          </span>
          <ThemeToggle />
        </div>

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/50 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 shrink-0 rounded-full bg-blue-600/10 dark:bg-blue-400/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-semibold text-xs border border-blue-600/20">
              {initials || <UserCheck className="w-4 h-4" />}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                {displayName}
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                {displayEmail}
              </p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            title="Sign out"
            aria-label="Sign out"
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Top Bar */}
      <header className="md:hidden sticky top-0 z-40 flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="font-bold text-blue-600 dark:text-blue-400 text-base">
            ApplyTrack
          </span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Open navigation menu"
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs md:hidden"
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
      <aside className="hidden md:block w-64 shrink-0 h-screen sticky top-0">
        {navContent}
      </aside>
    </>
  );
}
