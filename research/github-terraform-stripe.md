# GitHub, Terraform, and Stripe

These mature CLIs show how to combine human workflows with machine-readable
surfaces.

## GitHub CLI

`gh` supports `--json`, `--jq`, and `--template` for many commands. The field
list requirement is a strong agent pattern: it makes the user or agent choose
which fields to fetch and print.

Flourisher idea: keep `--fields` strict and discoverable. If the user omits the
field list in a future advanced command, print valid fields instead of dumping
everything.

Source: <https://cli.github.com/manual/gh_help_formatting>

## Terraform

Terraform has human-readable plan output, but also a documented JSON format for
plans and state via `terraform show -json`. The docs include versioning
guidance, which matters when downstream tooling depends on the schema.

Flourisher idea: version JSON payloads now, even while the data is hard-coded.
Agents and scripts should be able to reject unsupported major versions later.

Source: <https://developer.hashicorp.com/terraform/internals/json-format>

## Stripe CLI

The Stripe CLI is strong for developer feedback loops: it can stream request
logs, forward webhooks locally, and trigger deterministic events. Those are not
just commands; they are repeatable demos and test fixtures.

Flourisher idea: future demos should include deterministic fixtures such as
`flourisher search analytics --fixture buying-committee` or `flourisher demo
webhook-result`.

Source: <https://docs.stripe.com/stripe-cli/use-cli>

