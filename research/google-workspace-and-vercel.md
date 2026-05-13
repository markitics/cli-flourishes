# Google Workspace and Vercel

These are two current examples of CLIs being positioned directly as agent
surfaces, not just human developer tools.

## Google Workspace CLI

The Google Workspace CLI repo describes itself as one command-line tool for
Workspace APIs and includes AI agent skills. Its README says the repo ships
100+ `SKILL.md` files and curated recipes. The important design move is not the
number of commands; it is packaging command knowledge in files that agents can
load before acting.

What Flourisher can copy:

- A `skills/` or `docs/agent-skills/` folder with workflow-specific Markdown.
- One source of truth for command contracts, used by CLI help, docs, and any MCP
  or agent wrapper.
- Pagination and NDJSON-style streaming for list commands once the backend is
  live.

Source: <https://github.com/googleworkspace/cli>

## Vercel `api`

Vercel's January 2026 changelog describes `vercel api` as direct access to
Vercel APIs from the terminal and calls out AI agents explicitly. The pattern is
useful because the CLI inherits the already-authenticated terminal environment.

What Flourisher can copy:

- A low-level escape hatch such as `flourisher api /search -X POST ...` once the
  backend exists.
- Interactive request building for humans, direct endpoint mode for agents.
- Clear permission inheritance language in docs, because agent auth paths need
  to be predictable.

Source: <https://vercel.com/changelog/introducing-the-vercel-api-cli-command>

