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
    results: selectFields(results, options.fields),
  };

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
      command: "flourisher search <term>",
      status: "demo",
      behavior: "Returns the same hard-coded result set for any term.",
      flags: {
        "--output <table|json|csv>": "Choose human table output or machine-readable output.",
        "--fields <list>": "Comma-separated fields to return, useful for agents conserving context.",
        "--limit <n>": "Limit the number of demo rows returned.",
        "--no-links": "Disable terminal hyperlinks.",
        "--links": "Force terminal hyperlinks even when stdout is not a TTY.",
        "--wide": "Prefer wider columns for demos and screenshots.",
        "--compact": "Prefer narrower columns for small terminals.",
      },
      fields: {
        businessName: "Displayed as a hyperlink to website in table mode.",
        website: "Business website URL.",
        username: "Displayed as a hyperlink to profileUrl in table mode.",
        profileUrl: "Flourisher profile URL.",
        stripeIntegration: "Current or proposed Stripe surface.",
        acceptsLink: "Whether the business accepts a direct link-style handoff.",
        projects: "Whether a projects surface exists.",
        projectUrl: "Project URL when available.",
        verified: "Verification level.",
        products: "Products sold or enabled.",
        users: "Buyer or user profile.",
      },
    },
    null,
    2,
  )}\n`;
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
