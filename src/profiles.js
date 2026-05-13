import { DEMO_RESULTS } from "./data.js";

const DETAIL_SEEDS = [
  ["Austin, TX", "2019", "22", "Usage-based", "Same day", "Strong analytics fit; ask for data warehouse examples."],
  ["Portland, OR", "2020", "14", "Platform fee", "1 business day", "Useful for marketplace payout demos."],
  ["Chicago, IL", "2017", "31", "Annual contract", "2 business days", "Best when finance owns the buying process."],
  ["Raleigh, NC", "2021", "9", "Monthly tiers", "Same day", "Good lightweight storefront proof point."],
  ["Denver, CO", "2018", "18", "Per-seat", "Same day", "Useful if RevOps wants scheduled reports."],
  ["Boston, MA", "2016", "45", "Enterprise", "3 business days", "Procurement-heavy; expect longer evaluation."],
  ["San Diego, CA", "2019", "27", "Monthly tiers", "Same day", "Strong renewal and success workflow story."],
  ["Toronto, ON", "2022", "8", "Usage-based", "2 business days", "Promising API-first candidate but trust is lower."],
  ["New York, NY", "2018", "36", "Annual contract", "Same day", "Strong finance automation comparison row."],
  ["Nashville, TN", "2023", "5", "One-time setup", "Same day", "Good for small sellers and launch experiments."],
  ["Minneapolis, MN", "2017", "19", "Usage-based", "2 business days", "Risk workflow angle; verify support load claims."],
  ["Atlanta, GA", "2020", "11", "Monthly tiers", "Same day", "Support-led workflow with refund operations signal."],
  ["Seattle, WA", "2016", "52", "Enterprise", "1 business day", "Best technical buyer fit for analytics engineers."],
  ["Phoenix, AZ", "2019", "16", "Hardware plus SaaS", "2 business days", "Good in-person payment edge case."],
  ["Columbus, OH", "2021", "7", "Monthly tiers", "Same day", "Simple ecommerce add-on candidate."],
  ["San Francisco, CA", "2018", "29", "Per-seat", "Same day", "Strong subscription tooling story."],
  ["Salt Lake City, UT", "2022", "6", "Consulting plus SaaS", "3 business days", "Early-stage pricing research fit."],
  ["Madison, WI", "2020", "13", "Monthly tiers", "Same day", "Good compare row for growth analytics."],
];

export const ENRICHED_RESULTS = DEMO_RESULTS.map((result, index) => {
  const [headquarters, founded, teamSize, pricingModel, responseTime, buyingNote] =
    DETAIL_SEEDS[index];

  return {
    ...result,
    details: {
      headquarters,
      founded,
      teamSize,
      pricingModel,
      responseTime,
      buyingNote,
      nextAction: result.acceptsLink
        ? `Open the Flourisher profile for ${result.username} and send a link.`
        : `Review the website for ${result.username} before outreach.`,
      risk: riskFor(result),
    },
  };
});

export function findProfile(username) {
  const normalized = normalizeUsername(username);
  return ENRICHED_RESULTS.find((result) => result.username === normalized) ?? null;
}

export function findProfiles(usernames) {
  return usernames.map((username) => {
    return { requested: username, result: findProfile(username) };
  });
}

export function normalizeUsername(username) {
  return String(username).trim().replace(/^@/, "").toLowerCase();
}

function riskFor(result) {
  if (result.verified === "Unverified") return "Needs verification before recommendation.";
  if (result.verified === "Pilot") return "Pilot-level signal; validate customer proof.";
  if (!result.acceptsLink) return "No direct link handoff; expect manual workflow.";
  return "Low demo risk.";
}
