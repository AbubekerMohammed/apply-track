"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Mail } from "lucide-react";
import {
  AuthNotice,
  AuthShell,
  authButtonClass,
  authInputClass,
  authLinkClass,
} from "@/components/auth/auth-shell";

export function ForgotPasswordForm() {
  const [email, setEmail] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }
      setDone(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Reset your password">
      {done ? (
        <AuthNotice tone="success">
          If an account exists for that email, we&apos;ve sent a link to reset your password. It
          expires in 1 hour.
        </AuthNotice>
      ) : (
        <>
          {error && <AuthNotice tone="error">{error}</AuthNotice>}
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Enter your account email and we&apos;ll send you a link to choose a new password.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                Email address
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={authInputClass}
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>
            <button type="submit" disabled={loading} className={authButtonClass}>
              <span>{loading ? "Sending..." : "Send reset link"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </>
      )}
      <Link href="/login" className={authLinkClass}>
        Back to sign in
      </Link>
    </AuthShell>
  );
}
