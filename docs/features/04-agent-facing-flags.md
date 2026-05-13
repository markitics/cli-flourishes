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
flourisher describe search
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
```

### `describe search`

This is a lightweight runtime schema. It should grow into either
`flourisher schema search` or `flourisher describe --json search` with field
types, allowed values, examples, and backend support status.

```sh
flourisher describe search
```

### `--dry-run`

Not needed for read-only search, but it should be mandatory for mutating future
commands such as save, compare, note, export, or contact.

### `--explain`

For humans, explain why a row ranked. For agents, return a compact list of
signals used. The important rule is that explanations must be structured, not
free-form prose only.

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
