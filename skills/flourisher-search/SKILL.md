---
name: flourisher-search
description: Agent workflow for using the Flourisher CLI search demo without wasting context.
metadata:
  requires:
    bins: ["flourisher"]
  status: demo
---

# Flourisher Search Agent Skill

Use this skill when an agent needs to inspect Flourisher directory results from
the CLI.

## Rules

- Prefer `--json` for reads unless the user explicitly asks for a human table or
  screenshot.
- Use `--fields` on every search call. Do not fetch all fields when a small
  subset answers the question.
- Use `--limit` or `--page-size` for exploratory calls.
- Use `flourisher describe all` before relying on fields or browser-action
  flags you have not seen in the current session.
- Treat browser snapshots as documentation and review artifacts, not as data
  extraction surfaces.
- Do not infer backend freshness. This demo returns hard-coded data for every
  query.

## Common Workflows

### Find a few candidates

```sh
flourisher search analytics --json --fields businessName,username,acceptsLink,verified --limit 3
```

### Inspect a compact page

```sh
flourisher search analytics --json --fields businessName,username,products,users --page-size 5
```

### Render a human snapshot for review

```sh
flourisher browse analytics --snapshot --selected vectorgrove --pane details --columns 132
```

### Compare a marked set

```sh
flourisher browse analytics --snapshot --selected vectorgrove --marked atlasmetrics,vectorgrove --pane compare --columns 132
```

### Narrow the browser state

```sh
flourisher browse analytics --snapshot --filter refund --columns 96
```

## Recovery

- If a command fails on an unknown field, run `flourisher describe search` and
  choose from the returned field contract.
- If terminal output wraps, add `--columns <n>` or switch to `--json`.
- If the user asks for live backend freshness, say that this repo currently uses
  stubbed data and point to `docs/features/05-backend-contract.md`.
