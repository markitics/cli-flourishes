import { FIELD_CONTRACTS, commandContracts, explainResult } from "./contracts.js";

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
    width: { wide: 28, regular: 20, compact: 18 },
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
    width: { wide: 30, regular: 21, compact: 18 },
  },
  {
    key: "users",
    label: "Who uses them",
    width: { wide: 32, regular: 22, compact: 19 },
  },
];

export function formatTable(results, options = {}) {
  const mode = tableMode(options.columns, options.layout);
  const columns = TABLE_FIELDS.filter((field) => {
    if (!options.fields || options.fields.length === 0) return true;
    return options.fields.includes(field.key);
  });
  const color = options.color ?? false;
  const links = options.links ?? false;
  const header = [
    colorize(`Flourisher search: "${options.query}"`, BOLD, color),
    colorize(
      `Backend: stubbed demo data. Showing ${results.length} hard-coded results for every query.`,
      DIM,
      color,
    ),
    "",
  ];

  const border = makeBorder(columns, mode);
  const lines = [
    ...header,
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
    colorize(
      "Try: flourisher search analytics --output json --fields businessName,username,acceptsLink",
      DIM,
      color,
    ),
  ];

  return `${lines.join("\n")}\n`;
}

export function formatJson(results, options = {}) {
  const payload = {
    query: options.query,
    backend: {
      mode: "stub",
      note: "All queries return the same hard-coded demo results.",
    },
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
        "--no-links": "Disable terminal hyperlinks.",
        "--links": "Force terminal hyperlinks even when stdout is not a TTY.",
        "--wide": "Prefer wider columns for demos and screenshots.",
        "--compact": "Prefer narrower columns for small terminals.",
      },
      fields: FIELD_CONTRACTS,
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
        "--pane <results|details|compare>": "Choose the active pane.",
        "--columns <n>": "Pretend the terminal is n columns wide.",
      },
      keys: {
        "j/k": "Move selection down or up.",
        enter: "Open details for the selected row.",
        space: "Mark or unmark the selected row for comparison.",
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
