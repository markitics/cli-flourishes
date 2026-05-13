# Feature: Responsive Result Density

## Problem

Search results get messy as signals grow. A wide monitor can tolerate many
columns. A zoomed-in laptop terminal cannot. If Flourisher keeps adding Stripe,
trust, transaction, support, growth, and fit signals, a flat table becomes a
spreadsheet squeezed into a terminal.

## Proposed column groups

Use named groups instead of treating every field as equal:

- Identity: business name, website, username, profile.
- Stripe: integration type, marketplace listing, accepts link, product surface.
- Trust: verified level, verification source, response time, last active date.
- Commerce: products sold, pricing model, average order or contract size.
- Fit: who uses them, buyer role, company size, industry, geography.
- Workflow: projects, saved, compared, notes, next action.

## Width strategy

The command can select a layout by terminal width:

- Compact: identity, one Stripe summary, trust summary, products, users.
- Regular: separate link/projects/verified columns and short products/users.
- Wide: full set of current columns.
- Detail view: one row transposed into a two-column key/value panel.

The current implementation already accepts `--wide`, `--compact`, and
`--columns <n>` to make the table deterministic during demos and screenshot
generation.

## Resize behavior

For a future interactive app, terminal resize should rerender without losing
cursor position, filters, selected rows, or open detail state. This is easier in
a real TUI framework than in hand-written stdout tables.

## Group expand/collapse

A useful interaction would mirror spreadsheet grouped columns:

- `l`: expand the active group.
- `h`: collapse the active group.
- `1` through `6`: jump to a column group.
- `enter`: transpose the current row into a detail panel.

## Alternative

Use one-line cards instead of tables. Cards can feel warmer for humans, but they
are harder to scan when comparing 18 to 20 companies. A hybrid is better:
table for search results, card/detail panel for one selected company.
