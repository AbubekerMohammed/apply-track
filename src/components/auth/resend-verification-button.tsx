"use client";

import * as React from "react";

export function ResendVerificationButton({ email }: { email: string }) {
  const [status, setStatus] = React.useState<"idle" | "sending" | "sent" | "error">("idle");

  async function resend() {
    setStatus("sending");
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setStatus(res.ok ? "sent" : "error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <p className="text-xs text-emerald-700 dark:text-emerald-400">
        If this email needs verifying, a new link is on its way. Check your inbox.
      </p>
    );
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={resend}
        disabled={status === "sending" || !email}
        className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50"
      >
        {status === "sending" ? "Sending..." : "Resend verification email"}
      </button>
      {status === "error" && (
        <p className="text-xs text-rose-600 dark:text-rose-400">
          Couldn&apos;t send right now. Please try again in a minute.
        </p>
      )}
    </div>
  );
}
