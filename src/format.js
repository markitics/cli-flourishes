import { FIELD_CONTRACTS, commandContracts, explainResult } from "./contracts.js";
import { liveBackendContract } from "./provider.js";

const RESET = "\x1b[0m";
const DIM = "\x1b[2m";
const BOLD = "\x1b[1m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";

const TABLE_FIELDS = [
  {
    key: "businessName",
    label: "Business",
    width: { wide: 18, regular: 15, compact: 14 },
    urlKey: "website",
  },
  {
    key: "username",
    label: "Profile",
    width: { wide: 17, regular: 14, compact: 13 },
    urlKey: "profileUrl",
    transform: (value) => `@${value}`,
  },
  {
    key: "stripeIntegration",
    label: "Stripe",
    width: { wide: 28, regular: 20, compact: 16 },
  },
  {
    key: "acceptsLink",
    label: "Link",
    width: { wide: 6, regular: 6, compact: 5 },
    transform: yesNo,
  },
  {
    key: "projects",
    label: "Projects",
    width: { wide: 9, regular: 8, compact: 7 },
    urlKey: "projectUrl",
    transform: yesNo,
  },
  {
    key: "verified",
    label: "Verified",
    width: { wide: 10, regular: 9, compact: 8 },
  },
  {
    key: "products",
    label: "Products",
    width: { wide: 30, regular: 21, compact: 15 },
  },
  {
    key: "users",
    label: "Who uses them",
    width: { wide: 32, regular: 22, compact: 15 },
  },
];

export function formatTable(results, options = {}) {
  const columns = TABLE_FIELDS.filter((field) => {
    if (!options.fields || options.fields.length === 0) return true;
    return options.fields.includes(field.key);
  });
  const color = options.color ?? false;
  const links = options.links ?? false;
  const width = terminalWidth(options.columns);
  const mode = searchTableMode(columns, width, options.layout);
  const headerText = [
    `Flourisher search: "${options.query}"`,
    `Backend: stubbed demo data. Showing ${results.length} hard-coded results for every query.`,
  ];
  const tryText = "Try: flourisher search analytics --output json --fields businessName,username,acceptsLink";

  if (!mode) {
    return formatStackedSearch(results, columns, {
      color,
      links,
      width,
      headerText,
      tryText,
    });
  }

  const border = makeBorder(columns, mode);
  const lines = [
    colorize(headerText[0], BOLD, color),
    colorize(headerText[1], DIM, color),
    "",
    border.top,
    row(columns.map((field) => field.label), columns, mode, { color, header: true }),
    border.sep,
    ...results.map((result) => {
      return row(
        columns.map((field) => renderField(result, field, mode, { color, links })),
        columns,
        mode,
      );
    }),
    border.bottom,
    "",
    colorize(tryText, DIM, color),
  ];

  return `${lines.join("\n")}\n`;
}

export function formatJson(results, options = {}) {
  const payload = {
    query: options.query,
    backend: options.backend ?? {
      mode: "stub",
      provider: "demo",
      endpoint: null,
      note: "All queries return the same hard-coded demo results.",
    },
    request: options.request ?? null,
    count: results.length,
    page: options.page ?? null,
    results: selectFields(results, options.fields),
  };
  if (options.explain) {
    payload.explanations = results.map((result, index) => explainResult(result, index + (options.page?.offset ?? 0)));
  }

  return `${JSON.stringify(payload, null, 2)}\n`;
}

export function formatCsv(results, options = {}) {
  const fields = options.fields?.length ? options.fields : [
    "businessName",
    "website",
    "username",
    "profileUrl",
    "stripeIntegration",
    "acceptsLink",
    "projects",
    "verified",
    "products",
    "users",
  ];
  const lines = [
    fields.map(csvEscape).join(","),
    ...results.map((result) => fields.map((field) => csvEscape(result[field] ?? "")).join(",")),
  ];

  return `${lines.join("\n")}\n`;
}

export function describeSearchCommand() {
  return `${JSON.stringify(
    {
      version: 1,
      command: "flourisher search <term>",
      status: "demo",
      behavior: "Returns the same hard-coded result set for any term.",
      flags: {
        "--output <table|json|csv>": "Choose human table output or machine-readable output.",
        "--fields <list>": "Comma-separated fields to return, useful for agents conserving context.",
        "--limit <n>": "Limit the number of demo rows returned.",
        "--page-size <n>": "Return a cursor-shaped page of n demo rows.",
        "--cursor <token>": "Resume from an opaque demo cursor such as demo:2.",
        "--explain": "Include structured per-result display signals in JSON output.",
        "--backend <demo>": "Select the search provider; only demo is executable now.",
        "--no-links": "Disable terminal hyperlinks.",
        "--links": "Force terminal hyperlinks even when stdout is not a TTY.",
        "--wide": "Prefer wider columns for demos and screenshots.",
        "--compact": "Prefer narrower columns for small terminals.",
      },
      fields: FIELD_CONTRACTS,
      backendContract: liveBackendContract(),
      examples: commandContracts().commands.find((command) => command.name === "search").examples,
    },
    null,
    2,
  )}\n`;
}

export function describeAllCommands() {
  return `${JSON.stringify(
    {
      ...commandContracts(),
      fields: FIELD_CONTRACTS,
    },
    null,
    2,
  )}\n`;
}

export function describeProfileCommand() {
  return `${JSON.stringify(
    {
      command: "flourisher profile <username>",
      status: "demo",
      behavior: "Shows a hard-coded detail panel for one demo company.",
      flags: {
        "--output <table|json|csv>": "Choose human table output or machine-readable output.",
      },
    },
    null,
    2,
  )}\n`;
}

export function describeCompareCommand() {
  return `${JSON.stringify(
    {
      command: "flourisher compare <username...>",
      status: "demo",
      behavior: "Shows a hard-coded comparison table for selected demo companies.",
      flags: {
        "--output <table|json|csv>": "Choose human table output or machine-readable output.",
      },
    },
    null,
    2,
  )}\n`;
}

export function describeBrowseCommand() {
  return `${JSON.stringify(
    {
      command: "flourisher browse <term>",
      status: "demo",
      behavior: "Opens a keyboard-first result browser over the same hard-coded data.",
      flags: {
        "--snapshot": "Render one deterministic browser frame and exit, useful for docs and tests.",
        "--selected <username>": "Select a row before rendering.",
        "--marked <list>": "Comma-separated usernames to mark for comparison.",
        "--hidden <list>": "Comma-separated usernames hidden from a deterministic browser snapshot.",
        "--pane <results|details|compare>": "Choose the active pane.",
        "--command <text>": "Show a deterministic command/search prompt in the browser frame.",
        "--columns <n>": "Pretend the terminal is n columns wide.",
      },
      keys: {
        "j/k": "Move selection down or up.",
        enter: "Open details for the selected row.",
        space: "Mark or unmark the selected row for comparison.",
        c: "Open compare mode when two or more rows are marked.",
        x: "Remove the selected row from the current view.",
        u: "Restore hidden rows.",
        s: "Seed a product search for the selected row.",
        a: "Seed a question about the selected row.",
        tab: "Move to the next pane.",
        "h/l": "Move between panes.",
        esc: "Close the current pane or exit from results.",
        q: "Quit.",
      },
    },
    null,
    2,
  )}\n`;
}

export function formatProfile(profile, options = {}) {
  const rows = [
    ["Business", `${profile.businessName} (${profile.website})`],
    ["Profile", `@${profile.username} (${profile.profileUrl})`],
    ["Stripe", profile.stripeIntegration],
    ["Accepts link", yesNo(profile.acceptsLink)],
    ["Projects", profile.projects ? profile.projectUrl : "no"],
    ["Verified", profile.verified],
    ["Products", profile.products],
    ["Who uses them", profile.users],
    ["Headquarters", profile.details.headquarters],
    ["Founded", profile.details.founded],
    ["Team size", profile.details.teamSize],
    ["Pricing model", profile.details.pricingModel],
    ["Payment type", profile.details.paymentType],
    ["Compliance", profile.details.compliance],
    ["Integration depth", profile.details.integrationDepth],
    ["Response time", profile.details.responseTime],
    ["Buying note", profile.details.buyingNote],
    ["Risk", profile.details.risk],
    ["Next action", profile.details.nextAction],
  ];

  return `${formatKeyValueTable(`Flourisher profile: @${profile.username}`, rows, options)}\n`;
}

export function formatProfileJson(profile) {
  return `${JSON.stringify(profile, null, 2)}\n`;
}

export function formatProfileCsv(profile) {
  const flat = flattenProfile(profile);
  const fields = Object.keys(flat);
  return `${fields.map(csvEscape).join(",")}\n${fields.map((field) => csvEscape(flat[field])).join(",")}\n`;
}

export function formatComparison(profiles, options = {}) {
  const rows = profiles.map((profile) => {
    return {
      username: `@${profile.username}`,
      stripeIntegration: profile.stripeIntegration,
      acceptsLink: yesNo(profile.acceptsLink),
      verified: profile.verified,
      users: profile.users,
      note: profile.details.buyingNote,
    };
  });
  const columns = [
    { key: "username", label: "Profile", width: { wide: 17, regular: 15, compact: 13 } },
    { key: "stripeIntegration", label: "Stripe", width: { wide: 28, regular: 22, compact: 19 } },
    { key: "acceptsLink", label: "Link", width: { wide: 6, regular: 6, compact: 5 } },
    { key: "verified", label: "Verified", width: { wide: 10, regular: 9, compact: 8 } },
    { key: "users", label: "Who uses them", width: { wide: 32, regular: 25, compact: 20 } },
    { key: "note", label: "Buying note", width: { wide: 46, regular: 34, compact: 27 } },
  ];
  const mode = tableMode(options.columns, options.layout);
  const color = options.color ?? false;
  const border = makeBorder(columns, mode);
  const lines = [
    colorize("Flourisher compare", BOLD, color),
    colorize("Hard-coded detail comparison. No backend calls yet.", DIM, color),
    "",
    border.top,
    row(columns.map((field) => field.label), columns, mode, { color, header: true }),
    border.sep,
    ...rows.map((record) => {
      return row(
        columns.map((field) => {
          const display = truncate(String(record[field.key] ?? ""), field.width[mode]);
          return { rendered: display, display };
        }),
        columns,
        mode,
      );
    }),
    border.bottom,
  ];

  return `${lines.join("\n")}\n`;
}

export function formatComparisonJson(profiles) {
  return `${JSON.stringify({ count: profiles.length, profiles }, null, 2)}\n`;
}

export function formatComparisonCsv(profiles) {
  const fields = [
    "businessName",
    "username",
    "stripeIntegration",
    "acceptsLink",
    "verified",
    "products",
    "users",
    "buyingNote",
    "nextAction",
  ];
  const lines = [
    fields.map(csvEscape).join(","),
    ...profiles.map((profile) => {
      const flat = flattenProfile(profile);
      return fields.map((field) => csvEscape(flat[field] ?? "")).join(",");
    }),
  ];

  return `${lines.join("\n")}\n`;
}

function renderField(result, field, mode, options) {
  const width = field.width[mode];
  const raw = field.transform ? field.transform(result[field.key]) : result[field.key];
  const display = truncate(String(raw ?? ""), width);
  const url = result[field.urlKey];
  const linked = url ? hyperlink(display, url, options.links) : display;
  const colored = colorSignal(linked, display, field.key, options.color);

  return { rendered: colored, display };
}

function row(values, columns, mode, options = {}) {
  const cells = values.map((value, index) => {
    const field = columns[index];
    const width = field.width[mode];
    const cell = typeof value === "string"
      ? { rendered: value, display: value }
      : value;
    const display = truncate(cell.display, width);
    const rendered = typeof value === "string"
      ? display
      : cell.rendered;

    return ` ${padRendered(rendered, display, width)} `;
  });

  const output = `|${cells.join("|")}|`;
  return options.header ? colorize(output, BOLD, options.color) : output;
}

function makeBorder(columns, mode) {
  const pieces = columns.map((field) => "-".repeat(field.width[mode] + 2));
  return {
    top: `+${pieces.join("+")}+`,
    sep: `+${pieces.join("+")}+`,
    bottom: `+${pieces.join("+")}+`,
  };
}

function searchTableMode(columns, width, requested) {
  const candidates = requestedModes(requested);
  return candidates.find((mode) => tableWidth(columns, mode) <= width) ?? null;
}

function requestedModes(requested) {
  if (requested === "wide") return ["wide", "regular", "compact"];
  if (requested === "regular") return ["regular", "compact"];
  if (requested === "compact") return ["compact"];
  return ["wide", "regular", "compact"];
}

function tableWidth(columns, mode) {
  const contentWidth = columns.reduce((total, field) => total + field.width[mode] + 2, 0);
  return contentWidth + columns.length + 1;
}

function tableMode(columns = 120, requested) {
  if (requested === "wide" || requested === "regular" || requested === "compact") {
    return requested;
  }
  if (columns >= 160) return "wide";
  if (columns >= 112) return "regular";
  return "compact";
}

function selectFields(results, fields) {
  if (!fields || fields.length === 0) return results;
  return results.map((result) => {
    return Object.fromEntries(fields.map((field) => [field, result[field]]));
  });
}

function yesNo(value) {
  return value ? "yes" : "no";
}

function terminalWidth(columns) {
  const width = Number(columns);
  if (!Number.isFinite(width) || width < 20) return 80;
  return Math.floor(width);
}

function formatStackedSearch(results, columns, options) {
  const lines = [
    ...wrapStyledText(options.headerText[0], options.width, BOLD, options.color),
    ...wrapStyledText(options.headerText[1], options.width, DIM, options.color),
    "",
  ];

  results.forEach((result, index) => {
    const numberPrefix = `${index + 1}. `;
    const heading = resultHeading(result, columns, options);
    appendWrappedValue(lines, numberPrefix, heading.rendered, heading.display, options.width);

    if (hasColumn(columns, "businessName")) {
      appendLinkedValue(lines, "Website", result.website, result.website, options);
    }
    if (hasColumn(columns, "username")) {
      appendLinkedValue(lines, "Profile", result.profileUrl, result.profileUrl, options);
    }
    appendFieldValue(lines, result, "stripeIntegration", columns, "Stripe", null, options);
    appendStatusLine(lines, result, columns, options);
    if (hasColumn(columns, "projects")) {
      appendLinkedValue(
        lines,
        "Project",
        result.projects ? result.projectUrl : null,
        result.projects ? result.projectUrl : null,
        options,
      );
    }
    appendFieldValue(lines, result, "products", columns, "Products", null, options);
    appendFieldValue(lines, result, "users", columns, "Users", null, options);

    if (index < results.length - 1) lines.push("");
  });

  lines.push("");
  lines.push(...wrapStyledText(options.tryText, options.width, DIM, options.color));

  return `${lines.join("\n")}\n`;
}

function resultHeading(result, columns, options) {
  const pieces = [];
  if (hasColumn(columns, "businessName")) {
    pieces.push({
      rendered: hyperlink(result.businessName, result.website, options.links),
      display: result.businessName,
    });
  }
  if (hasColumn(columns, "username")) {
    const username = `@${result.username}`;
    pieces.push({
      rendered: hyperlink(username, result.profileUrl, options.links),
      display: username,
    });
  }

  if (pieces.length === 0) {
    return { rendered: "Result", display: "Result" };
  }

  return joinRendered(pieces, " - ");
}

function appendFieldValue(lines, result, key, columns, label, url, options) {
  if (!hasColumn(columns, key)) return;
  const raw = result[key];
  const display = String(raw ?? "");
  const rendered = hyperlink(display, url, options.links);
  appendLabeledValue(lines, label, rendered, display, options.width, url, options.links);
}

function appendStatusLine(lines, result, columns, options) {
  const statusFields = [
    ["acceptsLink", "Link", yesNo(result.acceptsLink)],
    ["projects", "Projects", yesNo(result.projects)],
    ["verified", "Verified", result.verified],
  ];
  const pieces = statusFields
    .filter(([key]) => hasColumn(columns, key))
    .map(([, label, value]) => `${label}: ${value}`);

  if (pieces.length === 0) return;
  const display = pieces.join(" | ");
  appendLabeledValue(lines, "Status", colorSignal(display, display, "verified", options.color), display, options.width);
}

function appendLinkedValue(lines, label, value, url, options) {
  if (!value) return;
  const display = String(value);
  appendLabeledValue(lines, label, hyperlink(display, url, options.links), display, options.width, url, options.links);
}

function appendLabeledValue(lines, label, rendered, display, width, url = null, links = false) {
  appendWrappedValue(lines, `   ${label}: `, rendered, display, width, url, links);
}

function appendWrappedValue(lines, prefix, rendered, display, width, url = null, links = false) {
  const continuationPrefix = " ".repeat(prefix.length);
  const available = Math.max(1, width - prefix.length);
  const chunks = wrapText(display, available);

  chunks.forEach((chunk, index) => {
    const linePrefix = index === 0 ? prefix : continuationPrefix;
    const renderedChunk = chunks.length === 1 && chunk === display
      ? rendered
      : hyperlink(chunk, url, links);
    lines.push(`${linePrefix}${renderedChunk}`);
  });
}

function wrapStyledText(text, width, style, color) {
  return wrapText(text, width).map((line) => colorize(line, style, color));
}

function wrapText(value, width) {
  const normalized = String(value).replace(/\s+/g, " ").trim();
  const safeWidth = Math.max(1, width);
  if (!normalized) return [""];

  const lines = [];
  let current = "";

  for (const word of normalized.split(" ")) {
    const chunks = splitLongWord(word, safeWidth);
    for (const chunk of chunks) {
      if (!current) {
        current = chunk;
      } else if (current.length + 1 + chunk.length <= safeWidth) {
        current = `${current} ${chunk}`;
      } else {
        lines.push(current);
        current = chunk;
      }
    }
  }

  if (current) lines.push(current);
  return lines;
}

function splitLongWord(word, width) {
  if (word.length <= width) return [word];
  const chunks = [];
  for (let index = 0; index < word.length; index += width) {
    chunks.push(word.slice(index, index + width));
  }
  return chunks;
}

function hasColumn(columns, key) {
  return columns.some((column) => column.key === key);
}

function joinRendered(pieces, separator) {
  return pieces.reduce((joined, piece) => {
    if (!joined) return piece;
    return {
      rendered: `${joined.rendered}${separator}${piece.rendered}`,
      display: `${joined.display}${separator}${piece.display}`,
    };
  }, null);
}

function truncate(value, width) {
  if (value.length <= width) return value;
  if (width <= 3) return value.slice(0, width);
  return `${value.slice(0, width - 3)}...`;
}

function padRendered(rendered, display, width) {
  return `${rendered}${" ".repeat(Math.max(0, width - display.length))}`;
}

function hyperlink(label, url, enabled) {
  if (!enabled || !url) return label;
  return `\x1b]8;;${url}\x07${label}\x1b]8;;\x07`;
}

function colorSignal(rendered, display, key, enabled) {
  if (!enabled) return rendered;
  if ((key === "acceptsLink" || key === "projects") && display === "yes") {
    return colorize(rendered, GREEN, true);
  }
  if (key === "verified" && (display === "Pilot" || display === "Community")) {
    return colorize(rendered, YELLOW, true);
  }
  return rendered;
}

function colorize(value, code, enabled) {
  return enabled ? `${code}${value}${RESET}` : value;
}

function csvEscape(value) {
  const normalized = String(value);
  if (!/[",\n]/.test(normalized)) return normalized;
  return `"${normalized.replaceAll("\"", "\"\"")}"`;
}

function formatKeyValueTable(title, rows, options = {}) {
  const color = options.color ?? false;
  const keyWidth = Math.max(...rows.map(([key]) => key.length), 12);
  const valueWidth = options.layout === "compact" ? 58 : 86;
  const columns = [
    { label: "Field", width: { wide: keyWidth, regular: keyWidth, compact: keyWidth } },
    { label: "Value", width: { wide: valueWidth, regular: valueWidth, compact: valueWidth } },
  ];
  const mode = "regular";
  const border = makeBorder(columns, mode);
  const lines = [
    colorize(title, BOLD, color),
    "",
    border.top,
    row(columns.map((field) => field.label), columns, mode, { color, header: true }),
    border.sep,
    ...rows.map(([key, value]) => {
      return row(
        [
          { rendered: key, display: key },
          { rendered: truncate(String(value), valueWidth), display: truncate(String(value), valueWidth) },
        ],
        columns,
        mode,
      );
    }),
    border.bottom,
  ];

  return lines.join("\n");
}

function flattenProfile(profile) {
  return {
    businessName: profile.businessName,
    website: profile.website,
    username: profile.username,
    profileUrl: profile.profileUrl,
    stripeIntegration: profile.stripeIntegration,
    acceptsLink: profile.acceptsLink,
    projects: profile.projects,
    projectUrl: profile.projectUrl,
    verified: profile.verified,
    products: profile.products,
    users: profile.users,
    headquarters: profile.details.headquarters,
    founded: profile.details.founded,
    teamSize: profile.details.teamSize,
    pricingModel: profile.details.pricingModel,
    responseTime: profile.details.responseTime,
    buyingNote: profile.details.buyingNote,
    risk: profile.details.risk,
    nextAction: profile.details.nextAction,
  };
}
