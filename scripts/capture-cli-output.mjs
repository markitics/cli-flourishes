#!/usr/bin/env node

import { existsSync, rmSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const assetDir = resolve(root, "docs/assets");

await mkdir(assetDir, { recursive: true });

await captureTerminal("search-table-wide", [
  "search",
  "analytics",
  "--no-links",
  "--columns",
  "160",
]);

await captureTerminal("search-cards-narrow", [
  "search",
  "analytics",
  "--no-links",
  "--columns",
  "64",
  "--limit",
  "4",
]);

await captureTerminal("browse-details-wide", [
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

await captureTerminal("browse-compare-wide", [
  "browse",
  "analytics",
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

await captureTerminal("browse-command-wide", [
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

async function captureTerminal(name, args) {
  const outputTxt = resolve(assetDir, `${name}.txt`);
  const outputSvg = resolve(assetDir, `${name}.svg`);
  const outputPng = resolve(assetDir, `${name}.png`);
  const result = spawnSync(
    process.execPath,
    [resolve(root, "bin/flourisher.js"), ...args],
    {
      cwd: root,
      encoding: "utf8",
      env: { ...process.env, NO_COLOR: "1" },
    },
  );

  if (result.status !== 0) {
    process.stderr.write(result.stderr);
    process.exit(result.status ?? 1);
  }

  const lines = result.stdout.trimEnd().split("\n");
  const charWidth = 8.2;
  const lineHeight = 18;
  const padding = 24;
  const width = Math.ceil(Math.max(...lines.map((line) => line.length)) * charWidth + padding * 2);
  const height = padding * 2 + lines.length * lineHeight;
  const text = lines
    .map((line, index) => {
      const y = padding + 14 + index * lineHeight;
      return renderSvgTextLine(line, padding, y);
    })
    .join("\n  ");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" rx="12" fill="#101418"/>
  <rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="11" fill="none" stroke="#2c3540"/>
  <circle cx="26" cy="22" r="5" fill="#e05d44"/>
  <circle cx="43" cy="22" r="5" fill="#f4bf4f"/>
  <circle cx="60" cy="22" r="5" fill="#54c571"/>
  <g transform="translate(0 22)" font-family="SFMono-Regular, Menlo, Consolas, monospace" font-size="13" fill="#d7e0e8">
  ${text}
  </g>
</svg>
`;

  await writeFile(outputTxt, result.stdout);
  await writeFile(outputSvg, svg);

  const sips = spawnSync("which", ["sips"], { encoding: "utf8" });
  if (sips.status === 0) {
    rmSync(outputPng, { force: true });
    spawnSync("sips", ["-s", "format", "png", outputSvg, "--out", outputPng], {
      encoding: "utf8",
    });
  }

  process.stdout.write(`Wrote ${outputTxt}\nWrote ${outputSvg}\n`);
  if (existsSync(outputPng)) {
    process.stdout.write(`Wrote ${outputPng}\n`);
  }
}

function escapeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;");
}

function renderSvgTextLine(line, x, y) {
  const pieces = [];
  const tagPattern = /\[[^\]]+\]/g;
  let cursor = 0;
  for (const match of line.matchAll(tagPattern)) {
    if (match.index > cursor) {
      pieces.push(`<tspan>${escapeXml(line.slice(cursor, match.index))}</tspan>`);
    }
    const tag = match[0];
    pieces.push(`<tspan fill="${tagFill(tag)}" font-weight="700">${escapeXml(tag)}</tspan>`);
    cursor = match.index + tag.length;
  }
  if (cursor < line.length) {
    pieces.push(`<tspan>${escapeXml(line.slice(cursor))}</tspan>`);
  }

  return `<text x="${x}" y="${y}">${pieces.join("")}</text>`;
}

function tagFill(tag) {
  const normalized = tag.toLowerCase();
  if (normalized.includes("unverified")) return "#ff7b91";
  if (normalized.includes("pending") || normalized.includes("pilot") || normalized.includes("community")) return "#f2cc60";
  if (normalized.includes("soc2") || normalized.includes("gold")) return "#63d297";
  if (normalized.includes("subscription") || normalized.includes("payment") || normalized.includes("marketplace")) return "#d9a3ff";
  if (normalized.includes("listed") || normalized.includes("deep") || normalized.includes("partner")) return "#8cc8ff";
  if (normalized.includes("silver")) return "#8cc8ff";
  return "#d7e0e8";
}
