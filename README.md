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

## Verification

```sh
npm test
npm run capture
node ./bin/flourisher.js search "analytics" --no-links --columns 160
node ./bin/flourisher.js search "analytics" --output json --limit 2
```

Open `docs/index.html` in a browser for the explainer page and copy-paste demo
commands.
