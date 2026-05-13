# Flourisher CLI Research

This folder collects open-source CLI examples worth studying for Flourisher.
The guide is split between human terminal UX and agent-facing contracts.

## Quick Seed

High-confidence patterns from the first pass:

- Human-first CLIs earn trust with fast scanning, predictable keyboard movement,
  visible status, and graceful non-interactive fallbacks.
- Agent-first CLIs need deterministic output, bounded responses, schema or
  command introspection, and mutation controls such as dry-run/apply.
- These are not opposing modes. A useful Flourisher design can keep rich tables
  and browse panes for people while exposing JSON, field selection, pagination,
  and `describe` contracts for agents.

## Initial Source Anchors

- Justin Poehnelt, "You Need to Rewrite Your CLI for AI Agents" (2026-03-04):
  agent DX should prioritize machine-readable output, runtime schema
  introspection, input hardening, field masks, dry runs, and skill/context
  files.
- Vercel changelog, "Introducing the `vercel api` CLI command" (2026-01-27):
  positions a CLI command as a direct surface for AI agents to call the Vercel
  API from an authenticated terminal environment.
- Guillermo Rauch X post:
  <https://x.com/rauchg/status/2029356560494018956>. The URL is reachable but
  did not expose readable text to this research environment; a secondary article
  links it and attributes the line "2026 is the year of Skills & CLIs." Treat
  that quote as secondary-sourced until a browser screenshot is captured.

## Research Notes

- [Human TUI Patterns](human-tui-patterns.md): keyboard-first panes, command
  strips, previews, tags, and responsive terminal layouts.
- [Agent Output Contracts](agent-output-contracts.md): bounded JSON, field
  masks, describe commands, dry runs, pagination, and safety rails.
- [Google Workspace and Vercel](google-workspace-and-vercel.md): modern
  agent-first CLI surfaces worth studying.
- [GitHub, Terraform, and Stripe](github-terraform-stripe.md): mature command
  contracts that combine human workflows with machine-readable output.
- [fzf and Charm Tools](fzf-and-charm.md): human-friendly terminal interaction
  patterns for fuzzy search, previews, and polished TUIs.
- [Flourisher Design Backlog](flourisher-design-backlog.md): concrete ideas
  to keep building from this research.
- [Source Log](source-log.md): dated links and screenshot follow-ups.
