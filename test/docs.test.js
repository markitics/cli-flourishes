import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";

const ROOT = new URL("..", import.meta.url).pathname;

test("html explainer references committed local assets and feature notes", () => {
  const htmlPath = resolve(ROOT, "docs/index.html");
  const html = readFileSync(htmlPath, "utf8");
  const hrefs = [...html.matchAll(/href="(\.\/[^"]+)"/g)].map((match) => match[1]);
  const srcs = [...html.matchAll(/src="(\.\/[^"]+)"/g)].map((match) => match[1]);
  const localReferences = [...hrefs, ...srcs]
    .filter((reference) => !reference.startsWith("#"))
    .filter((reference) => !reference.startsWith("./styles.css"));

  assert.ok(html.includes("Flourisher CLI Demo"));
  assert.ok(existsSync(resolve(ROOT, "docs/styles.css")));

  for (const reference of localReferences) {
    assert.ok(
      existsSync(resolve(ROOT, "docs", reference)),
      `Expected ${reference} to exist`,
    );
  }
});
