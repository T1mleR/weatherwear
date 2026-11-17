#!/usr/bin/env node
/**
 * Non-destructive production deployment smoke test.
 * Usage: node scripts/smoke-deployment.mjs https://your-app.up.railway.app
 * Does not create records or access paid external weather endpoints.
 */
import assert from "node:assert/strict";

const candidate = process.argv[2] || process.env.DEPLOY_URL;
if (!candidate) {
  console.error("Provide an HTTPS deployment URL as argument or DEPLOY_URL.");
  process.exit(2);
}
const url = new URL(candidate);
if (url.protocol !== "https:" && !["127.0.0.1", "localhost"].includes(url.hostname)) {
  throw new Error("Public deployments must use HTTPS.");
}
const base = url.href.replace(/\/$/, "");

async function request(path, init) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    return await fetch(base + path, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

const homepage = await request("/");
assert.equal(homepage.status, 200, "Public homepage");
assert.match(await homepage.text(), /WeatherWear AI/, "WeatherWear brand appears in HTML");

const health = await request("/api/health");
assert.equal(health.status, 200, "App and DB health check");
assert.equal((await health.json()).status, "ok");

const history = await request("/api/recommendations");
assert.equal(history.status, 200, "History API returns 200");
const rows = await history.json();
assert.ok(Array.isArray(rows), "History is an array");

const invalid = await request("/api/recommendations", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ city: "" }),
});
assert.equal(invalid.status, 400, "Empty city input returns 400");
assert.equal((await invalid.json()).error, "City is required");

console.log(`Deployment smoke passed at ${base}; existing recommendations: ${rows.length}`);
