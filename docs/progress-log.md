# Progress Log

This repo originally landed several feature slices with squash merges. After
the user asked for visible commits on `main`, later work switched to merge PRs
so individual commits remain visible in GitHub history.

## Original Squash-Merged Milestones

- PR #2: first hard-coded `flourisher search` table.
- PR #6: interactive search result browser.
- PR #7: agent-facing command contracts.
- PR #8: backend provider boundary.

## Visible Follow-Up PRs

- PR #9: fixed narrow terminal output by switching to wrapped stacked search
  cards when the full table cannot fit.
- PR #10: added the initial `research/` seed.
- PR #11: added richer profile signals, browser tags, compare-selected,
  remove-from-view, restore-hidden, and follow-on command prompts.
- PR #12: expanded the CLI research guide with separate files for human TUI
  patterns, agent contracts, Google Workspace/Vercel, GitHub/Terraform/Stripe,
  and fzf/Charm.
- PR #13: refreshed committed HTML demo assets for compare and command states.
- PR #14: added tags to narrow search cards, so the default output is easier to
  scan on small terminals.
- PR #15: refreshed the narrow search capture after tags were added.
- PR #16: added deterministic browser result filtering with `--filter`.

## Current Demo Commands

```sh
node ./bin/flourisher.js search analytics --no-links --columns 64 --limit 4
node ./bin/flourisher.js browse analytics --snapshot --selected vectorgrove --marked atlasmetrics,vectorgrove --pane compare --columns 132
node ./bin/flourisher.js browse analytics --snapshot --selected vectorgrove --pane details --command "search products" --columns 132
node ./bin/flourisher.js browse analytics --snapshot --filter refund --columns 96
node ./bin/flourisher.js search analytics --json --fields businessName,username,acceptsLink --limit 3
node ./bin/flourisher.js search analytics --ndjson --fields businessName,username --limit 3
```

## Current Verification

```sh
npm test
npm run capture
```
