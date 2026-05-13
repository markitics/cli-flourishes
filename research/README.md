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

## Planned Files

- `human-tui-patterns.md`: human-oriented terminal UX patterns.
- `agent-output-contracts.md`: agent-friendly CLI/API contracts.
- Individual example notes for GitHub CLI, Google Workspace CLI, Vercel CLI,
  Kubernetes/Terraform, and Charm/fuzzy/TUI tools.
- `source-log.md`: dated list of source links and screenshot follow-ups.

