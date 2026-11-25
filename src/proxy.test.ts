import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { proxy } from "./proxy";

function request(path: string, cookies: Record<string, string> = {}) {
  const cookie = Object.entries(cookies)
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
  return new NextRequest(`https://applytrack.example${path}`, {
    headers: cookie ? { cookie } : {},
  });
}

function redirectsToLogin(res: Response) {
  return (res.headers.get("location") ?? "").includes("/login");
}

describe("proxy", () => {
  it("sends visitors without a session to /login", () => {
    const res = proxy(request("/dashboard"));
    assert.ok(redirectsToLogin(res));
  });

  it("lets a normal session cookie through", () => {
    const res = proxy(request("/dashboard", { "__Secure-authjs.session-token": "abc" }));
    assert.ok(!redirectsToLogin(res));
  });

  it("lets a session split into chunks through (the Microsoft sign-in loop)", () => {
    const res = proxy(
      request("/dashboard", {
        "__Secure-authjs.session-token.0": "part-one",
        "__Secure-authjs.session-token.1": "part-two",
      })
    );
    assert.ok(!redirectsToLogin(res));
  });

  it("lets chunked cookies through on http (local development)", () => {
    const res = proxy(request("/settings", { "authjs.session-token.0": "part-one" }));
    assert.ok(!redirectsToLogin(res));
  });

  it("ignores other Auth.js cookies", () => {
    const res = proxy(
      request("/dashboard", {
        "__Secure-authjs.callback-url": "https%3A%2F%2Fapplytrack.example",
        "__Host-authjs.csrf-token": "xyz",
      })
    );
    assert.ok(redirectsToLogin(res));
  });
});
