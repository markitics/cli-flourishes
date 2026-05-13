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
flourisher search "analytics" --backend demo --json
flourisher search "analytics" --json --page-size 2 --cursor demo:2
flourisher search "analytics" --json --explain --fields businessName,username
```

Without linking:

```sh
node ./bin/flourisher.js search "analytics"
node ./bin/flourisher.js browse "analytics" --snapshot --selected vectorgrove --pane details
node ./bin/flourisher.js profile atlasmetrics
node ./bin/flourisher.js compare atlasmetrics vectorgrove summitschema
```

## What Search Shows

Search uses a table when the selected fields fit the detected terminal width.
On narrower terminals it switches to wrapped stacked results so human output
does not run past the declared columns. The default human output includes:

- Business name hyperlinked to its website when terminal hyperlinks are enabled.
- Username hyperlinked to a Flourisher profile.
- Stripe integration details.
- Whether the business accepts a link.
- Whether it appears in projects.
- Verification level.
- Products sold.
- Who uses them.

The backend is intentionally stubbed. Run `flourisher describe search` for the
machine-readable command contract, or `flourisher describe all` for all command
and field contracts.

## For Reviewers

- Open `docs/index.html` for the copy-paste demo page.
- Read `docs/progress-log.md` to see the visible PR sequence after the original
  squash-merged milestones.
- Read `research/README.md` for examples of other CLIs worth studying.
- Read `skills/flourisher-search/SKILL.md` for an agent-facing workflow example.

## Interactive Browse

Use `browse` for a keyboard-first result browser:

```sh
flourisher browse "analytics"
```

Keys:

- `j` / `k`: move between rows.
- `enter`: open the details pane.
- `space`: mark or unmark a company for comparison.
- `c`: compare selected companies once two or more are marked.
- `s`: seed a follow-on product search from the selected company.
- `a`: seed a question about the selected company.
- `x`: remove the selected company from the current view.
- `u`: restore hidden companies.
- `tab` or `l`: move to the next pane.
- `h`: move to the previous pane.
- `esc`: close the current pane or exit from results.
- `q`: quit.

For docs, tests, and screenshots, use deterministic snapshot mode:

```sh
flourisher browse "analytics" --snapshot --selected vectorgrove --marked atlasmetrics,vectorgrove --pane details --columns 132
flourisher browse "analytics" --snapshot --selected vectorgrove --pane details --command "search products"
flourisher browse "analytics" --snapshot --hidden atlasmetrics --selected northstar
flourisher browse "analytics" --snapshot --filter subscription --columns 96
```

## Verification

```sh
npm test
npm run capture
node ./bin/flourisher.js search "analytics" --no-links --columns 160
node ./bin/flourisher.js browse "analytics" --snapshot --selected vectorgrove --pane details
node ./bin/flourisher.js search "analytics" --output json --limit 2
node ./bin/flourisher.js search "analytics" --json --page-size 2 --cursor demo:2
node ./bin/flourisher.js search "analytics" --backend demo --json --limit 2
node ./bin/flourisher.js describe all
node ./bin/flourisher.js profile atlasmetrics
node ./bin/flourisher.js compare atlasmetrics vectorgrove
```

Open `docs/index.html` in a browser for the explainer page and copy-paste demo
commands.
