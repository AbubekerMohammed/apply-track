import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { clientIp, createRateLimiter } from "./rate-limit";

describe("createRateLimiter", () => {
  it("allows up to the limit within a window, then blocks", () => {
    const limiter = createRateLimiter({ limit: 3, windowMs: 1000 });
    assert.equal(limiter.check("a", 0), true);
    assert.equal(limiter.check("a", 10), true);
    assert.equal(limiter.check("a", 20), true);
    assert.equal(limiter.check("a", 30), false);
  });

  it("counts keys separately", () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 1000 });
    assert.equal(limiter.check("a", 0), true);
    assert.equal(limiter.check("b", 0), true);
    assert.equal(limiter.check("a", 1), false);
  });

  it("resets after the window ends", () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 1000 });
    assert.equal(limiter.check("a", 0), true);
    assert.equal(limiter.check("a", 999), false);
    assert.equal(limiter.check("a", 1000), true);
  });
});

describe("clientIp", () => {
  it("uses the first x-forwarded-for hop", () => {
    const req = new Request("https://x.test", {
      headers: { "x-forwarded-for": "203.0.113.7, 10.0.0.1" },
    });
    assert.equal(clientIp(req), "203.0.113.7");
  });

  it("falls back to unknown without headers", () => {
    assert.equal(clientIp(new Request("https://x.test")), "unknown");
  });
});
