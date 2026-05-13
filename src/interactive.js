const CLEAR_SCREEN = "\x1b[2J\x1b[H";
const HIDE_CURSOR = "\x1b[?25l";
const SHOW_CURSOR = "\x1b[?25h";
const RESET = "\x1b[0m";
const DIM = "\x1b[2m";
const BOLD = "\x1b[1m";
const BLUE = "\x1b[34m";
const CYAN = "\x1b[36m";
const GREEN = "\x1b[32m";
const MAGENTA = "\x1b[35m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const PANES = ["results", "details", "compare"];

export function formatBrowseFrame(results, options = {}) {
  const state = normalizeState(results, options);
  return `${renderFrame(state)}\n`;
}

export async function runBrowseSession(results, options, io) {
  const state = normalizeState(results, options);
  const stdin = io.stdin;
  const stdout = io.stdout;
  const canRunInteractive = Boolean(stdin?.isTTY && stdout?.isTTY && stdin.setRawMode);

  if (options.snapshot || !canRunInteractive) {
    stdout.write(formatBrowseFrame(results, options));
    return 0;
  }

  return new Promise((resolve) => {
    const render = () => {
      stdout.write(`${CLEAR_SCREEN}${renderFrame(state)}`);
    };
    const finish = () => {
      stdin.setRawMode(false);
      stdin.pause();
      stdin.off("data", onKey);
      stdout.write(`${SHOW_CURSOR}\n`);
      resolve(0);
    };
    const onKey = (input) => {
      const key = String(input);
      if (key === "\u0003" || key === "q") {
        finish();
        return;
      }
      if (key === "\u001b") {
        if (state.pane !== "results") {
          state.pane = "results";
          render();
          return;
        }
        finish();
        return;
      }
      if (key === "j" || key === "\u001b[B") {
        state.selectedIndex = Math.min(state.results.length - 1, state.selectedIndex + 1);
        render();
        return;
      }
      if (key === "k" || key === "\u001b[A") {
        state.selectedIndex = Math.max(0, state.selectedIndex - 1);
        render();
        return;
      }
      if (key === "\r" || key === "\n") {
        state.pane = "details";
        render();
        return;
      }
      if (key === " ") {
        toggleMarked(state);
        render();
        return;
      }
      if (key === "c" && state.marked.size >= 2) {
        state.pane = "compare";
        render();
        return;
      }
      if (key === "x") {
        hideSelected(state);
        render();
        return;
      }
      if (key === "u") {
        restoreHidden(state);
        render();
        return;
      }
      if (key === "s") {
        seedCommand(state, "search products");
        render();
        return;
      }
      if (key === "a" || key === "?") {
        seedCommand(state, "ask question");
        render();
        return;
      }
      if (key === "\t" || key === "l") {
        state.pane = nextPane(state.pane);
        render();
        return;
      }
      if (key === "h") {
        state.pane = previousPane(state.pane);
        render();
      }
    };

    stdin.setEncoding("utf8");
    stdin.setRawMode(true);
    stdin.resume();
    stdin.on("data", onKey);
    stdout.write(HIDE_CURSOR);
    render();
  });
}

function normalizeState(results, options) {
  const hidden = new Set(parseList(options.hidden));
  const visibleResults = results.filter((result) => !hidden.has(result.username));
  const selectedIndex = selectedIndexFor(visibleResults, options.selected);
  const marked = new Set(parseList(options.marked));
  if (options.markSelected) {
    const selected = visibleResults[selectedIndex];
    if (selected) marked.add(selected.username);
  }

  return {
    query: options.query ?? "",
    allResults: results,
    results: visibleResults,
    selectedIndex,
    marked,
    hidden,
    pane: PANES.includes(options.pane) ? options.pane : "results",
    command: options.command ?? "",
    color: options.color ?? false,
    columns: Number(options.columns) || 120,
    visibleRows: Number(options.visibleRows) || 9,
  };
}

function renderFrame(state) {
  const width = Math.max(78, Math.min(state.columns, 160));
  const title = `Flourisher interactive browse: "${state.query}"`;
  const tabs = renderTabs(state.pane);
  const command = renderCommandStrip(state);
  const body = width < 108 ? renderStacked(state) : renderSplit(state, width);
  const controls = controlsLine(state);
  const count = `${state.results.length} visible of ${state.allResults.length} hard-coded results | ${state.marked.size} marked | ${state.hidden.size} hidden`;

  return [
    line(width),
    fit(title, width),
    fit(count, width),
    fit(tabs, width),
    fit(command, width),
    line(width),
    ...body.map((row) => fit(row, width)),
    line(width),
    fit(controls, width),
    line(width),
  ].join("\n");
}

function renderSplit(state, width) {
  const rows = visibleResults(state).map((result, index) => {
    const actualIndex = state.windowStart + index;
    const cursor = actualIndex === state.selectedIndex ? ">" : " ";
    const mark = state.marked.has(result.username) ? "*" : " ";
    const business = pad(truncate(result.businessName, 17), 17);
    const profile = pad(truncate(`@${result.username}`, 18), 18);
    const tags = pad(tagSummary(result, state.color), 30);
    const stripe = pad(truncate(result.stripeIntegration, 22), 22);
    return `${cursor}${mark} ${business} ${profile} ${tags} ${stripe}`;
  });
  const selected = state.results[state.selectedIndex];
  const detail = detailLines(selected, state);
  const height = Math.max(rows.length + 2, detail.length + 2);
  const leftWidth = Math.min(83, Math.max(70, Math.floor(width * 0.62)));
  const rightWidth = width - leftWidth - 3;
  const lines = [
    `${pad("   Business          Profile            Tags                           Stripe", leftWidth)} | ${pad("Detail panel", rightWidth)}`,
    `${pad("--- ----------------- ------------------ ------------------------------ ----------------------", leftWidth)} | ${pad("------------", rightWidth)}`,
  ];

  for (let index = 0; index < height; index += 1) {
    lines.push(`${pad(rows[index] ?? "", leftWidth)} | ${pad(detail[index] ?? "", rightWidth)}`);
  }

  return lines;
}

function renderStacked(state) {
  const selected = state.results[state.selectedIndex];
  const rows = visibleResults(state).map((result, index) => {
    const actualIndex = state.windowStart + index;
    const cursor = actualIndex === state.selectedIndex ? ">" : " ";
    const mark = state.marked.has(result.username) ? "*" : " ";
    return `${cursor}${mark} ${truncate(result.businessName, 18)} | @${truncate(result.username, 16)} | ${tagSummary(result, state.color)}`;
  });

  return [
    "Results",
    "-------",
    ...rows,
    "",
    "Selected",
    "--------",
    ...detailLines(selected, state),
  ];
}

function detailLines(result, state) {
  if (!result) {
    return [
      "No visible results.",
      state.hidden.size > 0 ? "Press u to restore hidden rows." : "Try another search term.",
    ];
  }

  const marked = state.marked.has(result.username) ? "marked" : "not marked";
  const commandLines = commandResponseLines(state.command, result);
  const actions = actionLines(state);

  if (state.pane === "compare") {
    const compareRows = state.results
      .filter((candidate) => state.marked.has(candidate.username))
      .slice(0, 5)
      .map((candidate) => {
        return `* @${candidate.username}: ${candidate.details.paymentType}, ${candidate.details.compliance}, ${candidate.details.pricingModel}`;
      });
    return compareRows.length > 0
      ? ["Compare selected", ...compareRows, "", ...actions]
      : ["Compare selected", "Press space to mark rows for comparison.", "", ...actions];
  }

  if (state.pane === "details") {
    return [
      `${result.businessName} (@${result.username})`,
      `Tags: ${plainTagSummary(result)}`,
      `Website: ${result.website}`,
      `Profile: ${result.profileUrl}`,
      `Stripe: ${result.stripeIntegration}`,
      `Payment: ${result.details.paymentType}`,
      `Compliance: ${result.details.compliance}`,
      `Integration: ${result.details.integrationDepth}`,
      `Products: ${result.products}`,
      `Users: ${result.users}`,
      `HQ: ${result.details.headquarters}`,
      `Pricing: ${result.details.pricingModel}`,
      `Response: ${result.details.responseTime}`,
      `Risk: ${result.details.risk}`,
      `Note: ${result.details.buyingNote}`,
      ...commandLines,
      "",
      ...actions,
    ];
  }

  return [
    `${result.businessName} (@${result.username})`,
    `Tags: ${plainTagSummary(result)}`,
    `Status: ${marked}`,
    `Stripe: ${result.stripeIntegration}`,
    `Accepts link: ${yesNo(result.acceptsLink)}`,
    `Projects: ${result.projects ? "yes" : "no"}`,
    `Verified: ${result.verified}`,
    `Payment: ${result.details.paymentType}`,
    `Compliance: ${result.details.compliance}`,
    `Products: ${result.products}`,
    `Users: ${result.users}`,
    `Next: ${result.details.nextAction}`,
    ...commandLines,
    "",
    ...actions,
  ];
}

function visibleResults(state) {
  const half = Math.floor(state.visibleRows / 2);
  const maxStart = Math.max(0, state.results.length - state.visibleRows);
  state.windowStart = Math.min(Math.max(0, state.selectedIndex - half), maxStart);
  return state.results.slice(state.windowStart, state.windowStart + state.visibleRows);
}

function selectedIndexFor(results, username) {
  if (!username) return 0;
  const normalized = String(username).replace(/^@/, "").toLowerCase();
  const index = results.findIndex((result) => result.username === normalized);
  return index >= 0 ? index : 0;
}

function parseList(value) {
  if (!value) return [];
  return String(value)
    .split(",")
    .map((value) => value.trim().replace(/^@/, "").toLowerCase())
    .filter(Boolean);
}

function toggleMarked(state) {
  const username = state.results[state.selectedIndex]?.username;
  if (!username) return;
  if (state.marked.has(username)) {
    state.marked.delete(username);
    return;
  }
  state.marked.add(username);
}

function hideSelected(state) {
  const selected = state.results[state.selectedIndex];
  if (!selected) return;
  state.hidden.add(selected.username);
  state.marked.delete(selected.username);
  state.results = state.allResults.filter((result) => !state.hidden.has(result.username));
  state.selectedIndex = Math.min(state.selectedIndex, Math.max(0, state.results.length - 1));
}

function restoreHidden(state) {
  state.hidden.clear();
  state.results = state.allResults;
  state.selectedIndex = Math.min(state.selectedIndex, Math.max(0, state.results.length - 1));
}

function seedCommand(state, command) {
  const selected = state.results[state.selectedIndex];
  state.command = selected ? `${command}: ${selected.businessName}` : command;
  state.pane = "details";
}

function renderCommandStrip(state) {
  if (state.command) return `> /${state.command}`;
  return "> / search products | ask question | compare selected | remove from view";
}

function controlsLine(state) {
  const parts = ["j/k move", "enter details", "space mark"];
  if (state.marked.size >= 2) parts.push("c compare selected");
  parts.push("s search products", "a ask", "x remove");
  if (state.hidden.size > 0) parts.push("u restore hidden");
  parts.push("tab/l next pane", "h previous", "esc back", "q quit");
  return parts.join(" | ");
}

function actionLines(state) {
  const lines = [
    "Actions",
    "s search products",
    "a ask a question",
    "x remove from view",
  ];
  if (state.marked.size >= 2) lines.push("c compare selected");
  if (state.hidden.size > 0) lines.push("u restore hidden");
  return lines;
}

function commandResponseLines(command, result) {
  if (!command) return [];
  const normalized = command.toLowerCase();
  if (normalized.includes("search products")) {
    return [
      "",
      "Product search",
      `Matched: ${result.products}`,
      `Try next: flourisher search "${result.products.split(";")[0].toLowerCase()}" --fields businessName,products,users`,
    ];
  }
  if (normalized.includes("ask")) {
    return [
      "",
      "Question draft",
      `Ask: Which ${result.details.paymentType} workflow is strongest for ${result.businessName}?`,
      `Answer seed: ${result.details.buyingNote}`,
    ];
  }
  return ["", "Command preview", `No backend call yet for /${command}.`];
}

function tagSummary(result, color) {
  return [
    tag(result.verified, verificationTone(result.verified), color),
    tag(result.details.paymentType, "payment", color),
    tag(result.details.compliance, complianceTone(result.details.compliance), color),
  ].join(" ");
}

function plainTagSummary(result) {
  return [
    `[${result.verified}]`,
    `[${result.details.paymentType}]`,
    `[${result.details.compliance}]`,
    `[${result.details.integrationDepth}]`,
  ].join(" ");
}

function tag(label, tone, color) {
  return colorize(`[${label}]`, toneColor(tone), color);
}

function verificationTone(value) {
  if (value === "Gold") return "good";
  if (value === "Silver") return "info";
  if (value === "Pilot" || value === "Community") return "warn";
  return "bad";
}

function complianceTone(value) {
  if (value === "SOC2") return "good";
  if (value.includes("pending")) return "warn";
  if (value === "unverified") return "bad";
  return "info";
}

function toneColor(tone) {
  return {
    good: GREEN,
    info: CYAN,
    warn: YELLOW,
    bad: RED,
    payment: MAGENTA,
  }[tone] ?? BLUE;
}

function colorize(value, code, enabled) {
  return enabled ? `${code}${value}${RESET}` : value;
}

function renderTabs(active) {
  return PANES.map((pane) => (pane === active ? `[${titleCase(pane)}]` : ` ${titleCase(pane)} `)).join("  ");
}

function nextPane(active) {
  const index = PANES.indexOf(active);
  return PANES[(index + 1) % PANES.length];
}

function previousPane(active) {
  const index = PANES.indexOf(active);
  return PANES[(index - 1 + PANES.length) % PANES.length];
}

function titleCase(value) {
  return `${value[0].toUpperCase()}${value.slice(1)}`;
}

function line(width) {
  return "-".repeat(width);
}

function fit(value, width) {
  return truncate(String(value), width);
}

function truncate(value, width) {
  if (value.length <= width) return value;
  if (width <= 3) return value.slice(0, width);
  return `${value.slice(0, width - 3)}...`;
}

function pad(value, width) {
  const trimmed = truncate(value, width);
  return `${trimmed}${" ".repeat(Math.max(0, width - trimmed.length))}`;
}

function yesNo(value) {
  return value ? "yes" : "no";
}
