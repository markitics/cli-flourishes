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

function maxLineLength(output) {
  return Math.max(...output.trimEnd().split("\n").map((line) => line.length));
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
  assert.ok(maxLineLength(analytics.stdout) <= 160);
  assert.match(billing.stdout, /Flourisher search: "billing"/);
  assert.match(billing.stdout, /Showing 18 hard-coded results/);
});

test("search uses wrapped stacked output when the table cannot fit", () => {
  const result = run(["search", "analytics", "--no-links", "--columns", "64"]);

  assert.equal(result.status, 0);
  assert.ok(maxLineLength(result.stdout) <= 64);
  assert.doesNotMatch(result.stdout, /^\+/m);
  assert.match(result.stdout, /1\. Atlas Metrics - @atlasmetrics/);
  assert.match(result.stdout, /Website: https:\/\/example.com\/atlas-metrics/);
  assert.match(result.stdout, /Profile: https:\/\/flourisher.net\/atlasmetrics/);
  assert.match(result.stdout, /Tags: \[Gold\] \[marketplace payouts\] \[SOC2\]/);
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
  assert.equal(payload.fields[0].name, "businessName");
  assert.equal(payload.fields.find((field) => field.name === "acceptsLink").type, "boolean");
  assert.ok(payload.flags["--page-size <n>"]);
});

test("describe all returns command and field contracts", () => {
  const result = run(["describe", "all"]);

  assert.equal(result.status, 0);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.version, 1);
  assert.deepEqual(payload.commands.map((command) => command.name), [
    "search",
    "browse",
    "profile",
    "compare",
  ]);
  assert.equal(payload.fields.find((field) => field.name === "verified").type, "enum");
});

test("json search supports cursor-shaped pages", () => {
  const first = run(["search", "analytics", "--json", "--page-size", "2"]);
  const second = run([
    "search",
    "analytics",
    "--json",
    "--backend",
    "demo",
    "--page-size",
    "2",
    "--cursor",
    "demo:2",
  ]);

  assert.equal(first.status, 0);
  assert.equal(second.status, 0);
  const firstPayload = JSON.parse(first.stdout);
  const secondPayload = JSON.parse(second.stdout);
  assert.equal(firstPayload.page.nextCursor, "demo:2");
  assert.equal(firstPayload.backend.provider, "demo");
  assert.equal(firstPayload.request.backend, "demo");
  assert.equal(firstPayload.results[0].username, "atlasmetrics");
  assert.equal(secondPayload.page.cursor, "demo:2");
  assert.equal(secondPayload.results[0].username, "ledgerfield");
});

test("json search can include structured explanations", () => {
  const result = run([
    "search",
    "analytics",
    "--json",
    "--limit",
    "1",
    "--explain",
    "--fields",
    "businessName,username",
  ]);

  assert.equal(result.status, 0);
  const payload = JSON.parse(result.stdout);
  assert.deepEqual(Object.keys(payload.results[0]), ["businessName", "username"]);
  assert.equal(payload.explanations[0].username, "atlasmetrics");
  assert.match(payload.explanations[0].note, /Demo ranking is fixed/);
});

test("invalid cursor fails with cursor guidance", () => {
  const result = run(["search", "analytics", "--json", "--cursor", "bad"]);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /--cursor must be an opaque demo cursor/);
});

test("unsupported backend fails with available provider guidance", () => {
  const result = run(["search", "analytics", "--json", "--backend", "live"]);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /Unsupported backend "live"/);
  assert.match(result.stderr, /Available backend: demo/);
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

test("browse renders a deterministic interactive snapshot", () => {
  const result = run([
    "browse",
    "analytics",
    "--snapshot",
    "--selected",
    "vectorgrove",
    "--marked",
    "atlasmetrics,vectorgrove",
    "--pane",
    "details",
    "--columns",
    "132",
  ]);

  assert.equal(result.status, 0);
  assert.match(result.stdout, /Flourisher interactive browse: "analytics"/);
  assert.match(result.stdout, /Results\s+\[Details\]\s+Compare/);
  assert.match(result.stdout, />\* Vector Grove/);
  assert.match(result.stdout, /Website: https:\/\/example.com\/vector-grove/);
  assert.match(result.stdout, /j\/k move/);
});

test("search interactive can render a compare snapshot", () => {
  const result = run([
    "search",
    "analytics",
    "--interactive",
    "--snapshot",
    "--selected",
    "vectorgrove",
    "--marked",
    "atlasmetrics,vectorgrove",
    "--pane",
    "compare",
    "--columns",
    "132",
  ]);

  assert.equal(result.status, 0);
  assert.match(result.stdout, /\[Compare\]/);
  assert.match(result.stdout, /Compare selected/);
  assert.match(result.stdout, /\* @atlasmetrics: marketplace payouts, SOC2/);
  assert.match(result.stdout, /\* @vectorgrove: subscription, SOC2 pending/);
  assert.match(result.stdout, /c compare selected/);
});

test("browse can hide rows and show follow-on command prompts", () => {
  const hidden = run([
    "browse",
    "analytics",
    "--snapshot",
    "--hidden",
    "atlasmetrics",
    "--selected",
    "northstar",
    "--columns",
    "96",
  ]);
  const command = run([
    "browse",
    "analytics",
    "--snapshot",
    "--selected",
    "vectorgrove",
    "--pane",
    "details",
    "--command",
    "search products",
    "--columns",
    "132",
  ]);

  assert.equal(hidden.status, 0);
  assert.match(hidden.stdout, /17 visible of 18/);
  assert.doesNotMatch(hidden.stdout, />\s+Atlas Metrics/);
  assert.match(hidden.stdout, /u restore hidden/);
  assert.equal(command.status, 0);
  assert.match(command.stdout, /> \/search products/);
  assert.match(command.stdout, /Product search/);
  assert.match(command.stdout, /Segment analysis; lead scoring/);
});

test("browse snapshots can filter visible rows", () => {
  const result = run([
    "browse",
    "analytics",
    "--snapshot",
    "--filter",
    "refund",
    "--columns",
    "96",
  ]);

  assert.equal(result.status, 0);
  assert.match(result.stdout, /1 visible of 18/);
  assert.match(result.stdout, /filter "refund"/);
  assert.match(result.stdout, /Ribbon Desk/);
  assert.doesNotMatch(result.stdout, /Atlas Metrics/);
});

test("describe browse returns the keyboard contract", () => {
  const result = run(["describe", "browse"]);

  assert.equal(result.status, 0);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.command, "flourisher browse <term>");
  assert.equal(payload.keys["j/k"], "Move selection down or up.");
  assert.ok(payload.flags["--filter <term>"]);
  assert.equal(payload.keys.c, "Open compare mode when two or more rows are marked.");
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
