# Feature: Agent-Facing Flags

## Source notes

Justin Poehnelt's article argues that agents need deterministic,
machine-readable, narrow outputs, runtime introspection, and input hardening.
Source: https://justin.poehnelt.com/posts/rewrite-your-cli-for-ai-agents/

The current CLI implements the first small subset:

```sh
flourisher search "analytics" --output json
flourisher search "analytics" --fields businessName,username,acceptsLink
flourisher search "analytics" --limit 5
flourisher search "analytics" --json --page-size 2 --cursor demo:2
flourisher search "analytics" --json --explain --fields businessName,username
flourisher describe search
flourisher describe all
```

## Recommended flags

### `--output json`

Use for agents and scripts. It avoids table scraping and preserves booleans,
URLs, and nested future fields.

```sh
flourisher search "analytics" --output json
```

### `--fields`

Use field masks so an agent can conserve context.

```sh
flourisher search "analytics" --output json --fields businessName,username,profileUrl
```

### `--limit`, `--page-size`, and `--cursor`

`--limit` exists now. When the backend exists, prefer cursor pagination over
page numbers so results remain stable as the index changes.

```sh
flourisher search "analytics" --output json --limit 5
flourisher search "analytics" --json --page-size 2
flourisher search "analytics" --json --page-size 2 --cursor demo:2
```

Current cursor tokens are demo-only and shaped like `demo:2`; they prove the
contract without implying a real backend cursor exists yet.

### `describe search`

This is a lightweight runtime schema. It should grow into either
`flourisher schema search` or `flourisher describe --json search` with field
types, allowed values, examples, and backend support status.

```sh
flourisher describe search
flourisher describe all
```

The current implementation now includes field types, enum values, examples,
agent-safe command flags, and command examples.

### `--explain`

Use structured explanations when an agent needs enough context to decide what to
do next without requesting every field.

```sh
flourisher search "analytics" --json --explain --fields businessName,username
```

### `--dry-run`

Not needed for read-only search, but it should be mandatory for mutating future
commands such as save, compare, note, export, or contact.

For now, explanations are display signals over fixed demo ordering, not a live
ranking model.

### `--safe-output-dir`

When exports are added, write only under the current working directory by
default and reject path traversal. Agents can hallucinate paths.

### `--no-personal-data`

If future results include people, emails, or customer references, provide a
redacted mode that is safe to paste into prompts and tickets.

## Alternative

Expose only an MCP server and let agents skip the shell entirely. That may be
the right long-term API, but the CLI should still have JSON, fields, schema, and
validation because shell execution remains the lowest-friction integration path.
