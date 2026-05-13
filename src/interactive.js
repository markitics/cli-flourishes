const CLEAR_SCREEN = "\x1b[2J\x1b[H";
const HIDE_CURSOR = "\x1b[?25l";
const SHOW_CURSOR = "\x1b[?25h";
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
  const selectedIndex = selectedIndexFor(results, options.selected);
  const marked = new Set(parseMarked(options.marked));
  if (options.markSelected) {
    marked.add(results[selectedIndex]?.username);
  }

  return {
    query: options.query ?? "",
    results,
    selectedIndex,
    marked,
    pane: PANES.includes(options.pane) ? options.pane : "results",
    columns: Number(options.columns) || 120,
    visibleRows: Number(options.visibleRows) || 9,
  };
}

function renderFrame(state) {
  const selected = state.results[state.selectedIndex];
  const width = Math.max(78, Math.min(state.columns, 160));
  const title = `Flourisher interactive browse: "${state.query}"`;
  const tabs = renderTabs(state.pane);
  const body = width < 108 ? renderStacked(state) : renderSplit(state, width);
  const controls = "j/k move | enter details | space mark | tab/l next pane | h previous | esc back | q quit";
  const count = `${state.results.length} hard-coded results | ${state.marked.size} marked for compare`;

  return [
    line(width),
    fit(title, width),
    fit(count, width),
    fit(tabs, width),
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
    const stripe = pad(truncate(result.stripeIntegration, 27), 27);
    const trust = pad(truncate(`${yesNo(result.acceptsLink)} ${result.verified}`, 13), 13);
    return `${cursor}${mark} ${business} ${profile} ${stripe} ${trust}`;
  });
  const selected = state.results[state.selectedIndex];
  const detail = detailLines(selected, state);
  const height = Math.max(rows.length + 2, detail.length + 2);
  const leftWidth = Math.min(83, Math.max(70, Math.floor(width * 0.62)));
  const rightWidth = width - leftWidth - 3;
  const lines = [
    `${pad("   Business          Profile            Stripe                       Trust", leftWidth)} | ${pad("Detail panel", rightWidth)}`,
    `${pad("--- ----------------- ------------------ --------------------------- -------------", leftWidth)} | ${pad("------------", rightWidth)}`,
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
    return `${cursor}${mark} ${truncate(result.businessName, 18)} | @${truncate(result.username, 16)} | ${truncate(result.stripeIntegration, 24)} | ${yesNo(result.acceptsLink)} | ${result.verified}`;
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
  const marked = state.marked.has(result.username) ? "marked" : "not marked";
  if (state.pane === "compare") {
    const compareRows = state.results
      .filter((candidate) => state.marked.has(candidate.username))
      .slice(0, 5)
      .map((candidate) => `* @${candidate.username}: ${candidate.verified}, ${candidate.details.pricingModel}`);
    return compareRows.length > 0
      ? ["Compare set", ...compareRows]
      : ["Compare set", "Press space to mark rows for comparison."];
  }

  if (state.pane === "details") {
    return [
      `${result.businessName} (@${result.username})`,
      `Website: ${result.website}`,
      `Profile: ${result.profileUrl}`,
      `Stripe: ${result.stripeIntegration}`,
      `Products: ${result.products}`,
      `Users: ${result.users}`,
      `HQ: ${result.details.headquarters}`,
      `Pricing: ${result.details.pricingModel}`,
      `Response: ${result.details.responseTime}`,
      `Risk: ${result.details.risk}`,
      `Note: ${result.details.buyingNote}`,
    ];
  }

  return [
    `${result.businessName} (@${result.username})`,
    `Status: ${marked}`,
    `Stripe: ${result.stripeIntegration}`,
    `Accepts link: ${yesNo(result.acceptsLink)}`,
    `Projects: ${result.projects ? "yes" : "no"}`,
    `Verified: ${result.verified}`,
    `Products: ${result.products}`,
    `Users: ${result.users}`,
    `Next: ${result.details.nextAction}`,
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

function parseMarked(marked) {
  if (!marked) return [];
  return String(marked)
    .split(",")
    .map((value) => value.trim().replace(/^@/, "").toLowerCase())
    .filter(Boolean);
}

function toggleMarked(state) {
  const username = state.results[state.selectedIndex].username;
  if (state.marked.has(username)) {
    state.marked.delete(username);
    return;
  }
  state.marked.add(username);
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
