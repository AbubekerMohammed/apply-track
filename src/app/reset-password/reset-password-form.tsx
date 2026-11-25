"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Lock } from "lucide-react";
import {
  AuthNotice,
  authButtonClass,
  authInputClass,
  authLinkClass,
} from "@/components/auth/auth-shell";

export function ResetPasswordForm({ token, email }: { token: string; email: string }) {
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Couldn't reset your password. Please try again.");
        return;
      }
      setDone(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <>
        <AuthNotice tone="success">
          Your password has been updated and you&apos;ve been signed out everywhere. Sign in with
          your new password.
        </AuthNotice>
        <Link href="/login" className={authLinkClass}>
          Sign in
        </Link>
      </>
    );
  }

  return (
    <>
      {error && <AuthNotice tone="error">{error}</AuthNotice>}
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Setting a new password for <strong>{email}</strong>.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="password"
            className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
          >
            New password (min 8 characters)
          </label>
          <div className="relative">
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={authInputClass}
            />
            <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>
        </div>
        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
          >
            Confirm new password
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className={authInputClass}
            />
            <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>
        </div>
        <button type="submit" disabled={loading} className={authButtonClass}>
          <span>{loading ? "Saving..." : "Set new password"}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>
      <Link href="/forgot-password" className={authLinkClass}>
        Request a new link
      </Link>
    </>
  );
}
