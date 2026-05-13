# Agent Output Contracts

Agent-friendly CLIs need fewer surprises than human-only CLIs. The core
principle is: every expensive or ambiguous byte should be optional.

## Strong Patterns

- `--output json`: the default human view can be rich, but agents need stable
  machine-readable payloads.
- `--fields`: let the caller choose a small subset so an agent does not spend
  context on irrelevant fields.
- `--page-size` and `--cursor`: list commands should be bounded by default.
- `--output ndjson`: one object per line gives agents a streaming-style format
  that can be consumed incrementally.
- `describe`: runtime command and field contracts help agents learn the current
  binary rather than relying on stale docs.
- `--dry-run` for mutations: agents should be able to validate write requests
  before causing side effects.
- Explicit non-interactive equivalents: every TUI action should map to a flag or
  subcommand, such as `--hidden`, `compare`, `profile`, or future `notes add`.
- Skill files: a repo-tracked `SKILL.md` can teach agents workflow rules that do
  not belong in terse `--help` output.

## Open Questions for Flourisher

- Should `search` default to a concise JSON shape when stdout is not a TTY?
- Should browser actions emit an audit event or command replay line so agents
  can reproduce the same state?
- Should future backend errors include a structured `recoverable` field and
  recommended next command?
- Should each backend surface get its own skill file, or should Flourisher keep
  one higher-level buying-research skill?

## Sources

- Justin Poehnelt, "You Need to Rewrite Your CLI for AI Agents":
  <https://justin.poehnelt.com/posts/rewrite-your-cli-for-ai-agents/>
- GitHub CLI formatting docs:
  <https://cli.github.com/manual/gh_help_formatting>
- Terraform JSON output docs:
  <https://developer.hashicorp.com/terraform/internals/json-format>
