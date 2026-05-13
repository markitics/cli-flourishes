import { DEMO_RESULTS, RESULT_FIELDS } from "./data.js";
import {
  describeSearchCommand,
  formatCsv,
  formatJson,
  formatTable,
} from "./format.js";

const VERSION = "0.1.0";

export async function run(argv, io) {
  const parsed = parseArgs(argv);
  const color = supportsColor(io.env);
  const links = parsed.options.links ?? (Boolean(io.stdout.isTTY) && !parsed.options.noLinks);
  const columns = parsed.options.columns ?? io.columns ?? Number(io.env.COLUMNS) ?? 120;

  if (parsed.command === "help" || parsed.options.help) {
    io.stdout.write(helpText());
    return 0;
  }

  if (parsed.options.version) {
    io.stdout.write(`flourisher ${VERSION}\n`);
    return 0;
  }

  if (parsed.command === "describe" && parsed.positionals[0] === "search") {
    io.stdout.write(describeSearchCommand());
    return 0;
  }

  if (parsed.command !== "search") {
    io.stderr.write(`Unknown or missing command: ${parsed.command || "(none)"}\n\n`);
    io.stderr.write(helpText());
    return 1;
  }

  const query = parsed.positionals.join(" ").trim();
  if (!query) {
    io.stderr.write("Search requires a term, for example: flourisher search analytics\n");
    return 1;
  }

  const requestedFields = parseFields(parsed.options.fields);
  const fieldError = validateFields(requestedFields);
  if (fieldError) {
    io.stderr.write(`${fieldError}\n`);
    return 1;
  }

  const limit = parseLimit(parsed.options.limit);
  if (limit instanceof Error) {
    io.stderr.write(`${limit.message}\n`);
    return 1;
  }

  const results = DEMO_RESULTS.slice(0, limit ?? DEMO_RESULTS.length);
  const renderOptions = {
    query,
    color,
    links,
    columns,
    fields: requestedFields,
    layout: parsed.options.layout,
  };

  if (parsed.options.output === "json") {
    io.stdout.write(formatJson(results, renderOptions));
    return 0;
  }

  if (parsed.options.output === "csv") {
    io.stdout.write(formatCsv(results, renderOptions));
    return 0;
  }

  io.stdout.write(formatTable(results, renderOptions));
  return 0;
}

function parseArgs(argv) {
  const options = {
    output: "table",
    fields: null,
    limit: null,
    help: false,
    version: false,
    noLinks: false,
    links: undefined,
    layout: undefined,
    columns: undefined,
  };
  const positionals = [];
  let command = null;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--help" || arg === "-h") {
      options.help = true;
      continue;
    }
    if (arg === "--version" || arg === "-v") {
      options.version = true;
      continue;
    }
    if (arg === "--json") {
      options.output = "json";
      continue;
    }
    if (arg === "--csv") {
      options.output = "csv";
      continue;
    }
    if (arg === "--output" || arg === "-o") {
      options.output = readValue(argv, index, arg);
      index += 1;
      continue;
    }
    if (arg.startsWith("--output=")) {
      options.output = arg.slice("--output=".length);
      continue;
    }
    if (arg === "--fields") {
      options.fields = readValue(argv, index, arg);
      index += 1;
      continue;
    }
    if (arg.startsWith("--fields=")) {
      options.fields = arg.slice("--fields=".length);
      continue;
    }
    if (arg === "--limit") {
      options.limit = readValue(argv, index, arg);
      index += 1;
      continue;
    }
    if (arg.startsWith("--limit=")) {
      options.limit = arg.slice("--limit=".length);
      continue;
    }
    if (arg === "--no-links") {
      options.noLinks = true;
      options.links = false;
      continue;
    }
    if (arg === "--links") {
      options.links = true;
      continue;
    }
    if (arg === "--wide") {
      options.layout = "wide";
      continue;
    }
    if (arg === "--compact") {
      options.layout = "compact";
      continue;
    }
    if (arg === "--columns") {
      options.columns = Number(readValue(argv, index, arg));
      index += 1;
      continue;
    }
    if (arg.startsWith("--columns=")) {
      options.columns = Number(arg.slice("--columns=".length));
      continue;
    }
    if (arg.startsWith("-")) {
      throw new Error(`Unknown flag: ${arg}`);
    }

    if (!command) {
      command = arg;
    } else {
      positionals.push(arg);
    }
  }

  validateOutput(options.output);
  return { command, positionals, options };
}

function readValue(argv, index, flag) {
  const value = argv[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`${flag} requires a value`);
  }
  return value;
}

function validateOutput(output) {
  if (!["table", "json", "csv"].includes(output)) {
    throw new Error(`--output must be one of table, json, csv; got ${output}`);
  }
}

function parseFields(fields) {
  if (!fields) return [];
  return fields.split(",").map((field) => field.trim()).filter(Boolean);
}

function validateFields(fields) {
  const unknown = fields.filter((field) => !RESULT_FIELDS.includes(field));
  if (unknown.length === 0) return null;
  return `Unknown field(s): ${unknown.join(", ")}. Valid fields: ${RESULT_FIELDS.join(", ")}`;
}

function parseLimit(limit) {
  if (!limit) return null;
  const value = Number(limit);
  if (!Number.isInteger(value) || value < 1) {
    return new Error("--limit must be a positive integer");
  }
  return value;
}

function supportsColor(env) {
  if (env.NO_COLOR) return false;
  if (env.FORCE_COLOR && env.FORCE_COLOR !== "0") return true;
  return false;
}

function helpText() {
  return `flourisher ${VERSION}

Usage
  flourisher search <term> [options]
  flourisher describe search

Search behavior
  This demo ignores the term and returns the same hard-coded result set.
  The future version can swap the stub for a backend without changing the UX contract.

Options
  -o, --output <table|json|csv>  Output format. Default: table
      --json                     Alias for --output json
      --csv                      Alias for --output csv
      --fields <list>            Comma-separated fields to include
      --limit <n>                Limit the number of rows
      --links                    Force terminal hyperlinks
      --no-links                 Disable terminal hyperlinks
      --wide                     Prefer wider table columns
      --compact                  Prefer narrower table columns
      --columns <n>              Pretend the terminal is n columns wide
  -h, --help                     Show this help
  -v, --version                  Show the version

Examples
  flourisher search "analytics"
  flourisher search "analytics" --wide
  flourisher search "analytics" --output json --fields businessName,username,acceptsLink
  flourisher search "anything" --csv --limit 5
`;
}
