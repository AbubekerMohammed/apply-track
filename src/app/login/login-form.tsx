"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Briefcase, ArrowRight, Lock, Mail, AlertCircle, ShieldCheck } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export default function LoginForm({
  demoMode,
  googleEnabled,
  microsoftEnabled,
}: {
  demoMode: boolean;
  googleEnabled: boolean;
  microsoftEnabled: boolean;
}) {
  const router = useRouter();
  const showGoogle = demoMode || googleEnabled;
  const showMicrosoft = demoMode || microsoftEnabled;
  const showSocial = showGoogle || showMicrosoft;
  const [callbackUrl, setCallbackUrl] = React.useState("/dashboard");

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const cb = params.get("callbackUrl");
      if (cb) setCallbackUrl(cb);
    }
  }, []);

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (res?.error) {
        setError("Invalid email or password. Please try again or create an account.");
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred during sign-in.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDemoLogin(provider: string, testEmail?: string, testPassword?: string) {
    setError(null);
    setLoading(true);

    try {
      if (provider === "google-demo") {
        const res = await signIn("credentials", {
          redirect: false,
          demoProvider: "google",
        });
        if (res?.ok) {
          router.push(callbackUrl);
          router.refresh();
        } else {
          setError("Failed to sign in with Google test account.");
        }
      } else if (provider === "microsoft-demo") {
        const res = await signIn("credentials", {
          redirect: false,
          demoProvider: "microsoft",
        });
        if (res?.ok) {
          router.push(callbackUrl);
          router.refresh();
        } else {
          setError("Failed to sign in with Microsoft test account.");
        }
      } else if (provider === "test-account" && testEmail && testPassword) {
        await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: testEmail.split("@")[0].replace(".", " "),
            email: testEmail,
            password: testPassword,
          }),
        });

        const res = await signIn("credentials", {
          redirect: false,
          email: testEmail,
          password: testPassword,
        });

        if (res?.ok) {
          router.push(callbackUrl);
          router.refresh();
        } else {
          setError("Failed to sign in with test account.");
        }
      }
    } catch {
      setError("An unexpected error occurred during demo sign-in.");
    } finally {
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
          {error && (
            <div className="p-3.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center gap-2.5 text-xs text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Social / OAuth Logins */}
          {showSocial && (
          <>
          <div className={`grid ${showGoogle && showMicrosoft ? "grid-cols-2" : "grid-cols-1"} gap-3`}>
            {showGoogle && (
            <button
              type="button"
              disabled={loading}
              onClick={() =>
                demoMode ? handleDemoLogin("google-demo") : signIn("google", { callbackUrl })
              }
              className="flex items-center justify-center gap-2.5 px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Google</span>
            </button>
            )}

            {showMicrosoft && (
            <button
              type="button"
              disabled={loading}
              onClick={() =>
                demoMode
                  ? handleDemoLogin("microsoft-demo")
                  : signIn("microsoft-entra-id", { callbackUrl })
              }
              className="flex items-center justify-center gap-2.5 px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 23 23">
                <path fill="#f35325" d="M1 1h10v10H1z" />
                <path fill="#81bc06" d="M12 1h10v10H12z" />
                <path fill="#05a6f0" d="M1 12h10v10H1z" />
                <path fill="#ffba08" d="M12 12h10v10H12z" />
              </svg>
              <span>Microsoft</span>
            </button>
            )}
          </div>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
            <span className="bg-white dark:bg-[#111622] px-3 text-[11px] uppercase tracking-wider text-slate-400 font-medium absolute">
              Or email and password
            </span>
          </div>
          </>
          )}

          {/* Email / Password Form */}
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
              <label
                htmlFor="password"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type="password"
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

          {/* Phase 1 Multi-User Fast Testing Block */}
          {demoMode && (
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Multi-User Test Accounts</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Click either test account to verify data isolation:
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={() =>
                  handleDemoLogin(
                    "test-account",
                    "alice.tester@applytrack.io",
                    "Password123!"
                  )
                }
                className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] text-left transition-colors"
              >
                <span className="block font-semibold text-slate-900 dark:text-white">Alice (Dev)</span>
                <span className="text-[10px] text-slate-500 truncate block">alice.tester@...</span>
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() =>
                  handleDemoLogin(
                    "test-account",
                    "bob.tester@applytrack.io",
                    "Password123!"
                  )
                }
                className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] text-left transition-colors"
              >
                <span className="block font-semibold text-slate-900 dark:text-white">Bob (Design)</span>
                <span className="text-[10px] text-slate-500 truncate block">bob.tester@...</span>
              </button>
            </div>
          </div>
          )}
        </div>
      </div>
    </div>
  );
}
