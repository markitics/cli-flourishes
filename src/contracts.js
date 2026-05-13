export const FIELD_CONTRACTS = [
  {
    name: "businessName",
    type: "string",
    table: true,
    description: "Human-facing business name.",
    example: "Atlas Metrics",
  },
  {
    name: "website",
    type: "url",
    table: false,
    description: "Canonical business URL.",
    example: "https://example.com/atlas-metrics",
  },
  {
    name: "username",
    type: "string",
    table: true,
    description: "Flourisher username without @.",
    example: "atlasmetrics",
  },
  {
    name: "profileUrl",
    type: "url",
    table: false,
    description: "Canonical Flourisher profile URL.",
    example: "https://flourisher.net/atlasmetrics",
  },
  {
    name: "stripeIntegration",
    type: "string",
    table: true,
    description: "Short summary of the Stripe surface or listing.",
    example: "Marketplace app: analytics",
  },
  {
    name: "acceptsLink",
    type: "boolean",
    table: true,
    description: "Whether the business accepts a direct link handoff.",
    example: true,
  },
  {
    name: "projects",
    type: "boolean",
    table: true,
    description: "Whether a Flourisher projects surface exists.",
    example: true,
  },
  {
    name: "projectUrl",
    type: "url|null",
    table: false,
    description: "Project URL when available.",
    example: "https://flourisher.net/projects/atlasmetrics",
  },
  {
    name: "verified",
    type: "enum",
    table: true,
    allowedValues: ["Gold", "Silver", "Community", "Pilot", "Unverified"],
    description: "Current demo verification level.",
    example: "Gold",
  },
  {
    name: "products",
    type: "string",
    table: true,
    description: "Short product summary.",
    example: "Cohort dashboards; KPI alerts",
  },
  {
    name: "users",
    type: "string",
    table: true,
    description: "Short buyer or user profile.",
    example: "Growth teams; SaaS founders",
  },
];

export function commandContracts() {
  return {
    version: 1,
    dataMode: "hard-coded-demo",
    commands: [
      {
        name: "search",
        usage: "flourisher search <term>",
        behavior: "Returns the same hard-coded result set for any term.",
        outputs: ["table", "json", "csv"],
        agentSafe: true,
        examples: [
          "flourisher search analytics --backend demo --output json",
          "flourisher search analytics --output json --fields businessName,username,acceptsLink --page-size 3",
          "flourisher search analytics --json --page-size 2 --cursor demo:2",
          "flourisher search analytics --json --explain --fields businessName,username",
        ],
      },
      {
        name: "browse",
        usage: "flourisher browse <term>",
        behavior: "Opens a keyboard-first result browser over the same hard-coded data.",
        outputs: ["table"],
        agentSafe: false,
        examples: [
          "flourisher browse analytics --snapshot --selected vectorgrove --pane details",
        ],
      },
      {
        name: "profile",
        usage: "flourisher profile <username>",
        behavior: "Shows a hard-coded detail panel for one demo company.",
        outputs: ["table", "json", "csv"],
        agentSafe: true,
        examples: ["flourisher profile atlasmetrics --json"],
      },
      {
        name: "compare",
        usage: "flourisher compare <username...>",
        behavior: "Shows a hard-coded comparison table for selected demo companies.",
        outputs: ["table", "json", "csv"],
        agentSafe: true,
        examples: ["flourisher compare atlasmetrics vectorgrove --json"],
      },
    ],
  };
}

export function explainResult(result, index) {
  const signals = [
    result.acceptsLink ? "accepts direct link handoff" : "requires manual handoff",
    result.projects ? "has projects surface" : "no projects surface",
    `verification level: ${result.verified}`,
    `stripe surface: ${result.stripeIntegration}`,
  ];

  return {
    username: result.username,
    rank: index + 1,
    note: "Demo ranking is fixed; signals explain display context, not a live model score.",
    signals,
  };
}
