# Flourisher

Flourisher is a deliberately small CLI demo for exploring what a search
experience could feel like in the terminal.

The first command is:

```sh
flourisher search "analytics"
```

For now every query returns the same hard-coded set of demo companies. The point
is to test presentation, interaction, and agent-facing contracts before a
backend exists.

## Try It

```sh
npm install
npm link
flourisher search "analytics"
flourisher search "anything" --wide
flourisher search "analytics" --output json --fields businessName,username,acceptsLink
```

Without linking:

```sh
node ./bin/flourisher.js search "analytics"
node ./bin/flourisher.js browse "analytics" --snapshot --selected vectorgrove --pane details
node ./bin/flourisher.js profile atlasmetrics
node ./bin/flourisher.js compare atlasmetrics vectorgrove summitschema
```

## What Search Shows

The default table includes:

- Business name hyperlinked to its website when terminal hyperlinks are enabled.
- Username hyperlinked to a Flourisher profile.
- Stripe integration details.
- Whether the business accepts a link.
- Whether it appears in projects.
- Verification level.
- Products sold.
- Who uses them.

The backend is intentionally stubbed. Run `flourisher describe search` for the
machine-readable command contract.

## Interactive Browse

Use `browse` for a keyboard-first result browser:

```sh
flourisher browse "analytics"
```

Keys:

- `j` / `k`: move between rows.
- `enter`: open the details pane.
- `space`: mark or unmark a company for comparison.
- `tab` or `l`: move to the next pane.
- `h`: move to the previous pane.
- `esc`: close the current pane or exit from results.
- `q`: quit.

For docs, tests, and screenshots, use deterministic snapshot mode:

```sh
flourisher browse "analytics" --snapshot --selected vectorgrove --marked atlasmetrics,vectorgrove --pane details --columns 132
```

## Verification

```sh
npm test
npm run capture
node ./bin/flourisher.js search "analytics" --no-links --columns 160
node ./bin/flourisher.js browse "analytics" --snapshot --selected vectorgrove --pane details
node ./bin/flourisher.js search "analytics" --output json --limit 2
node ./bin/flourisher.js profile atlasmetrics
node ./bin/flourisher.js compare atlasmetrics vectorgrove
```

Open `docs/index.html` in a browser for the explainer page and copy-paste demo
commands.
