"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Briefcase, ArrowRight, Lock, Mail, AlertCircle, CheckCircle2 } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { ResendVerificationButton } from "@/components/auth/resend-verification-button";

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  CredentialsSignin: "Incorrect email or password.",
  OAuthAccountNotLinked:
    "An account with this email already exists. Sign in with the method you used originally.",
  AccessDenied: "Access was denied. Please try again.",
  Configuration: "Sign-in is temporarily unavailable. Please try again shortly.",
  Verification: "This sign-in link has expired. Please try again.",
};

interface LoginFormProps {
  google: boolean;
  microsoft: boolean;
  callbackUrl: string;
  initialError?: string;
  registered?: boolean;
  /** False when account emails can't be sent; hides resend and password recovery. */
  emailAvailable: boolean;
}

export function LoginForm({
  google,
  microsoft,
  callbackUrl,
  initialError,
  registered,
  emailAvailable,
}: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(
    initialError
      ? AUTH_ERROR_MESSAGES[initialError] ?? "Sign-in failed. Please try again."
      : null
  );
  const [loading, setLoading] = React.useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = React.useState<string | null>(null);

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setUnverifiedEmail(null);
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (!res || res.error) {
        // "email_not_verified" is thrown by the credentials provider in src/auth.ts.
        const notVerified = res?.code === "email_not_verified";
        setUnverifiedEmail(notVerified ? email : null);
        setError(notVerified ? "Please verify your email first." : AUTH_ERROR_MESSAGES.CredentialsSignin);
        setLoading(false);
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError("Something went wrong while signing in. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-[#0b0f17] text-slate-900 dark:text-slate-100 transition-colors">
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="flex items-center justify-center gap-2.5 mb-6 group">
          <div className="w-9 h-9 rounded-lg bg-slate-900 dark:bg-white flex items-center justify-center text-white dark:text-slate-900 shadow-xs">
            <Briefcase className="w-4 h-4" />
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">
            ApplyTrack
          </span>
        </Link>
        <h1 className="text-center text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Sign in to your account
        </h1>
        <p className="mt-2 text-center text-xs text-slate-500 dark:text-slate-400">
          Or{" "}
          <Link
            href="/register"
            className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
          >
            create a new account for free
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-[#111622] py-8 px-6 sm:px-8 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          {registered && !error && (
            <div className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 flex items-center gap-2.5 text-xs text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Account created. Sign in to continue.</span>
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="p-3.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center gap-2.5 text-xs text-rose-600 dark:text-rose-400"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {unverifiedEmail &&
            (emailAvailable ? (
              <ResendVerificationButton email={unverifiedEmail} />
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                We can&apos;t send verification emails right now. Please continue with Google.
              </p>
            ))}

          <OAuthButtons
            google={google}
            microsoft={microsoft}
            callbackUrl={callbackUrl}
            disabled={loading}
            dividerLabel="Or email and password"
          />

          <form onSubmit={handleEmailLogin} className="space-y-4">
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
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="password"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300"
                >
                  Password
                </label>
                {emailAvailable && (
                  <Link
                    href="/forgot-password"
                    className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Forgot password?
                  </Link>
                )}
              </div>
              <div className="relative">
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 font-medium text-sm transition-colors disabled:opacity-50 shadow-xs"
            >
              <span>{loading ? "Signing in..." : "Sign in with Email"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
