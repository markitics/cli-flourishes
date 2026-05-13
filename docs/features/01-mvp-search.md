# Feature: Stubbed Search Table

## What exists now

`flourisher search <term>` returns 18 hard-coded demo companies for every term.
That is intentional. The backend, ranking model, and source data are out of
scope for this first slice.

The table is designed around the first buying-decision questions:

- Who is the business?
- Where is its public website?
- What is the Flourisher profile?
- What Stripe surface do they appear to support?
- Do they accept a direct link handoff?
- Are they present in projects?
- What do they sell?
- Who appears to use them?

## Current command examples

```sh
flourisher search "analytics"
flourisher search "analytics" --wide
flourisher search "billing" --no-links --columns 160
```

## Current decision

The default output is a table because the first human workflow is browsing and
comparing. The binary also supports JSON and CSV because an agent or script
should not have to scrape a table.

## Alternative

Start with JSON only and let a web page or downstream script render the table.
That would be simpler to implement but would dodge the core question: whether
the CLI itself can feel good enough for humans to use directly.

## Open questions

- Should the default table show all columns or collapse lower-priority columns
  when the terminal is narrow?
- Should verified levels be product-defined values or fetched from Stripe and
  Flourisher separately?
- Should projects be a binary flag, a count, or a link to an expandable list?
