import { RESULT_FIELDS } from "./data.js";
import { runBrowseSession } from "./interactive.js";
import { searchProvider } from "./provider.js";
import {
  describeAllCommands,
  describeCompareCommand,
  describeBrowseCommand,
  describeProfileCommand,
  describeSearchCommand,
  formatComparison,
  formatComparisonCsv,
  formatComparisonJson,
  formatCsv,
  formatJson,
  formatProfile,
  formatProfileCsv,
  formatProfileJson,
  formatTable,
} from "./format.js";
import { ENRICHED_RESULTS, findProfile, findProfiles } from "./profiles.js";

const VERSION = "0.1.0";

export async function run(argv, io) {
  const parsed = parseArgs(argv);
  const color = supportsColor(io.env, io.stdout);
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

  if (parsed.command === "describe" && (!parsed.positionals[0] || parsed.positionals[0] === "all")) {
    io.stdout.write(describeAllCommands());
    return 0;
  }

  if (parsed.command === "describe" && parsed.positionals[0] === "search") {
    io.stdout.write(describeSearchCommand());
    return 0;
  }

  if (parsed.command === "describe" && parsed.positionals[0] === "profile") {
    io.stdout.write(describeProfileCommand());
    return 0;
  }

  if (parsed.command === "describe" && parsed.positionals[0] === "compare") {
    io.stdout.write(describeCompareCommand());
    return 0;
  }

  if (parsed.command === "describe" && parsed.positionals[0] === "browse") {
    io.stdout.write(describeBrowseCommand());
    return 0;
  }

  if (parsed.command === "profile") {
    return renderProfile(parsed, io, { color, columns });
  }

  if (parsed.command === "compare") {
    return renderCompare(parsed, io, { color, columns });
  }

  if (parsed.command === "browse") {
    return renderBrowse(parsed, io, { color, columns });
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
  const providerResult = searchProvider({
    backend: parsed.options.backend,
    query,
    fields: requestedFields,
    limit,
    pageSize: parsed.options.pageSize,
    cursor: parsed.options.cursor,
    explain: parsed.options.explain,
  });
  if (providerResult instanceof Error) {
    io.stderr.write(`${providerResult.message}\n`);
    return 1;
  }

  const results = providerResult.results;
  if (parsed.options.interactive || parsed.options.snapshot) {
    if (parsed.options.output !== "table") {
      io.stderr.write("--interactive and --snapshot require table output\n");
      return 1;
    }
    return renderBrowseWithQuery(query, parsed, io, { color, columns, limit });
  }

  const renderOptions = {
    query,
    color,
    links,
    columns,
    fields: requestedFields,
    layout: parsed.options.layout,
    explain: parsed.options.explain,
    backend: providerResult.backend,
    request: providerResult.request,
    page: providerResult.page,
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

function renderBrowse(parsed, io, context) {
  const query = parsed.positionals.join(" ").trim();
  if (!query) {
    io.stderr.write("Browse requires a term, for example: flourisher browse analytics\n");
    return 1;
  }

  if (parsed.options.output !== "table") {
    io.stderr.write("Browse currently supports table output only; use search --output json for agent output\n");
    return 1;
  }

  const limit = parseLimit(parsed.options.limit);
  if (limit instanceof Error) {
    io.stderr.write(`${limit.message}\n`);
    return 1;
  }

  return renderBrowseWithQuery(query, parsed, io, { ...context, limit });
}

function renderBrowseWithQuery(query, parsed, io, context) {
  const results = ENRICHED_RESULTS.slice(0, context.limit ?? ENRICHED_RESULTS.length);

  return runBrowseSession(results, {
    query,
    color: context.color,
    columns: context.columns,
    selected: parsed.options.selected,
    marked: parsed.options.marked,
    hidden: parsed.options.hidden,
    filter: parsed.options.filter,
    markSelected: parsed.options.markSelected,
    pane: parsed.options.pane,
    command: parsed.options.command,
    snapshot: parsed.options.snapshot,
    visibleRows: parsed.options.rows,
  }, io);
}

function renderProfile(parsed, io, context) {
  const username = parsed.positionals[0];
  if (!username) {
    io.stderr.write("Profile requires a username, for example: flourisher profile atlasmetrics\n");
    return 1;
  }

  const profile = findProfile(username);
  if (!profile) {
    io.stderr.write(`No hard-coded demo profile found for ${username}\n`);
    return 1;
  }

  if (parsed.options.output === "json") {
    io.stdout.write(formatProfileJson(profile));
    return 0;
  }

  if (parsed.options.output === "csv") {
    io.stdout.write(formatProfileCsv(profile));
    return 0;
  }

  io.stdout.write(formatProfile(profile, {
    color: context.color,
    columns: context.columns,
    layout: parsed.options.layout,
  }));
  return 0;
}

function renderCompare(parsed, io, context) {
  const requested = parsed.positionals.flatMap((value) => value.split(",")).filter(Boolean);
  if (requested.length < 2) {
    io.stderr.write("Compare requires at least two usernames, for example: flourisher compare atlasmetrics vectorgrove\n");
    return 1;
  }

  const matches = findProfiles(requested);
  const missing = matches.filter((match) => !match.result).map((match) => match.requested);
  if (missing.length > 0) {
    io.stderr.write(`No hard-coded demo profile found for: ${missing.join(", ")}\n`);
    return 1;
  }

  const profiles = matches.map((match) => match.result);
  if (parsed.options.output === "json") {
    io.stdout.write(formatComparisonJson(profiles));
    return 0;
  }

  if (parsed.options.output === "csv") {
    io.stdout.write(formatComparisonCsv(profiles));
    return 0;
  }

  io.stdout.write(formatComparison(profiles, {
    color: context.color,
    columns: context.columns,
    layout: parsed.options.layout,
  }));
  return 0;
}

function parseArgs(argv) {
  const options = {
    output: "table",
    fields: null,
    limit: null,
    pageSize: null,
    cursor: null,
    explain: false,
    backend: "demo",
    help: false,
    version: false,
    noLinks: false,
    links: undefined,
    layout: undefined,
    columns: undefined,
    interactive: false,
    snapshot: false,
    selected: null,
    marked: null,
    hidden: null,
    filter: null,
    markSelected: false,
    pane: null,
    command: null,
    rows: null,
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
    if (arg === "--page-size") {
      options.pageSize = readValue(argv, index, arg);
      index += 1;
      continue;
    }
    if (arg.startsWith("--page-size=")) {
      options.pageSize = arg.slice("--page-size=".length);
      continue;
    }
    if (arg === "--cursor") {
      options.cursor = readValue(argv, index, arg);
      index += 1;
      continue;
    }
    if (arg.startsWith("--cursor=")) {
      options.cursor = arg.slice("--cursor=".length);
      continue;
    }
    if (arg === "--explain") {
      options.explain = true;
      continue;
    }
    if (arg === "--backend") {
      options.backend = readValue(argv, index, arg);
      index += 1;
      continue;
    }
    if (arg.startsWith("--backend=")) {
      options.backend = arg.slice("--backend=".length);
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
    if (arg === "--interactive" || arg === "-i") {
      options.interactive = true;
      continue;
    }
    if (arg === "--snapshot") {
      options.snapshot = true;
      continue;
    }
    if (arg === "--mark-selected") {
      options.markSelected = true;
      continue;
    }
    if (arg === "--selected") {
      options.selected = readValue(argv, index, arg);
      index += 1;
      continue;
    }
    if (arg.startsWith("--selected=")) {
      options.selected = arg.slice("--selected=".length);
      continue;
    }
    if (arg === "--marked") {
      options.marked = readValue(argv, index, arg);
      index += 1;
      continue;
    }
    if (arg.startsWith("--marked=")) {
      options.marked = arg.slice("--marked=".length);
      continue;
    }
    if (arg === "--hidden") {
      options.hidden = readValue(argv, index, arg);
      index += 1;
      continue;
    }
    if (arg.startsWith("--hidden=")) {
      options.hidden = arg.slice("--hidden=".length);
      continue;
    }
    if (arg === "--filter") {
      options.filter = readValue(argv, index, arg);
      index += 1;
      continue;
    }
    if (arg.startsWith("--filter=")) {
      options.filter = arg.slice("--filter=".length);
      continue;
    }
    if (arg === "--pane") {
      options.pane = readValue(argv, index, arg);
      index += 1;
      continue;
    }
    if (arg.startsWith("--pane=")) {
      options.pane = arg.slice("--pane=".length);
      continue;
    }
    if (arg === "--command") {
      options.command = readValue(argv, index, arg);
      index += 1;
      continue;
    }
    if (arg.startsWith("--command=")) {
      options.command = arg.slice("--command=".length);
      continue;
    }
    if (arg === "--rows") {
      options.rows = Number(readValue(argv, index, arg));
      index += 1;
      continue;
    }
    if (arg.startsWith("--rows=")) {
      options.rows = Number(arg.slice("--rows=".length));
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

function supportsColor(env, stdout) {
  if (env.NO_COLOR) return false;
  if (env.FORCE_COLOR && env.FORCE_COLOR !== "0") return true;
  return Boolean(stdout?.isTTY);
}

function helpText() {
  return `flourisher ${VERSION}

Usage
  flourisher search <term> [options]
  flourisher browse <term> [options]
  flourisher profile <username> [options]
  flourisher compare <username...> [options]
  flourisher describe <search|browse|profile|compare>

Search behavior
  This demo ignores the term and returns the same hard-coded result set.
  The future version can swap the stub for a backend without changing the UX contract.

Options
  -o, --output <table|json|csv>  Output format. Default: table
      --json                     Alias for --output json
      --csv                      Alias for --output csv
      --fields <list>            Comma-separated fields to include
      --limit <n>                Limit the number of rows
      --page-size <n>            Return a cursor-shaped page of n rows
      --cursor <token>           Resume from a cursor such as demo:2
      --explain                  Include JSON display signals
      --backend <demo>           Select result provider. Default: demo
      --links                    Force terminal hyperlinks
      --no-links                 Disable terminal hyperlinks
      --wide                     Prefer wider table columns
      --compact                  Prefer narrower table columns
      --columns <n>              Pretend the terminal is n columns wide
      --interactive, -i          Open the keyboard-first result browser
      --snapshot                 Render the browser frame once and exit
      --selected <username>      Select a row in snapshot or browser mode
      --marked <list>            Comma-separated compare set for browser mode
      --hidden <list>            Comma-separated usernames hidden from browser snapshots
      --filter <term>            Filter browser rows by company, product, user, or Stripe text
      --pane <results|details|compare>
                                  Select the active browser pane
      --command <text>           Show a deterministic browser command/search prompt
  -h, --help                     Show this help
  -v, --version                  Show the version

Examples
  flourisher search "analytics"
  flourisher search "analytics" --wide
  flourisher search "analytics" --output json --fields businessName,username,acceptsLink
  flourisher search "analytics" --json --page-size 2 --cursor demo:2
  flourisher search "analytics" --json --explain --fields businessName,username
  flourisher search "analytics" --interactive
  flourisher browse "analytics" --snapshot --selected vectorgrove --pane details
  flourisher search "anything" --csv --limit 5
  flourisher profile atlasmetrics
  flourisher compare atlasmetrics vectorgrove summitschema
`;
}
