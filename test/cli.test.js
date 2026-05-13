import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { test } from "node:test";

const BIN = new URL("../bin/flourisher.js", import.meta.url);

function run(args, options = {}) {
  return spawnSync(process.execPath, [BIN.pathname, ...args], {
    encoding: "utf8",
    env: { ...process.env, NO_COLOR: "1", ...options.env },
  });
}

test("search renders the hard-coded table for any term", () => {
  const analytics = run(["search", "analytics", "--no-links", "--columns", "160"]);
  const billing = run(["search", "billing", "--no-links", "--columns", "160"]);

  assert.equal(analytics.status, 0);
  assert.equal(billing.status, 0);
  assert.match(analytics.stdout, /Flourisher search: "analytics"/);
  assert.match(analytics.stdout, /Atlas Metrics/);
  assert.match(analytics.stdout, /Vector Grove/);
  assert.match(analytics.stdout, /Showing 18 hard-coded results/);
  assert.match(billing.stdout, /Flourisher search: "billing"/);
  assert.match(billing.stdout, /Showing 18 hard-coded results/);
});

test("json output is stable and field selectable", () => {
  const result = run([
    "search",
    "analytics",
    "--output",
    "json",
    "--fields",
    "businessName,username,acceptsLink",
    "--limit",
    "2",
  ]);

  assert.equal(result.status, 0);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.backend.mode, "stub");
  assert.equal(payload.count, 2);
  assert.deepEqual(Object.keys(payload.results[0]), [
    "businessName",
    "username",
    "acceptsLink",
  ]);
});

test("csv output can be limited", () => {
  const result = run(["search", "analytics", "--csv", "--limit", "3"]);

  assert.equal(result.status, 0);
  assert.equal(result.stdout.trim().split("\n").length, 4);
  assert.match(result.stdout, /^businessName,website,username/);
});

test("describe search returns the machine-readable command contract", () => {
  const result = run(["describe", "search"]);

  assert.equal(result.status, 0);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.command, "flourisher search <term>");
  assert.equal(payload.fields.businessName, "Displayed as a hyperlink to website in table mode.");
});

test("profile renders a hard-coded detail view", () => {
  const result = run(["profile", "@atlasmetrics"]);

  assert.equal(result.status, 0);
  assert.match(result.stdout, /Flourisher profile: @atlasmetrics/);
  assert.match(result.stdout, /Headquarters/);
  assert.match(result.stdout, /Austin, TX/);
  assert.match(result.stdout, /Buying note/);
});

test("compare renders selected demo profiles", () => {
  const result = run(["compare", "atlasmetrics", "vectorgrove", "--columns", "160"]);

  assert.equal(result.status, 0);
  assert.match(result.stdout, /Flourisher compare/);
  assert.match(result.stdout, /@atlasmetrics/);
  assert.match(result.stdout, /@vectorgrove/);
});

test("profile and compare support json output", () => {
  const profile = run(["profile", "atlasmetrics", "--json"]);
  const compare = run(["compare", "atlasmetrics,vectorgrove", "--json"]);

  assert.equal(profile.status, 0);
  assert.equal(compare.status, 0);
  assert.equal(JSON.parse(profile.stdout).details.headquarters, "Austin, TX");
  assert.equal(JSON.parse(compare.stdout).count, 2);
});

test("invalid fields fail with valid field guidance", () => {
  const result = run(["search", "analytics", "--fields", "businessName,nope"]);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /Unknown field/);
  assert.match(result.stderr, /businessName/);
});
