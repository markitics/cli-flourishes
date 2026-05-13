# Flourisher Design Backlog

This backlog turns the research into concrete next steps.

## Human UI

- Add a real filter box in `browse` so typing narrows the visible result set.
- Add a command palette with `/search products`, `/ask`, `/compare`, `/hide`,
  `/restore`, `/note`, and `/open`.
- Add a notes pane backed by a local JSON file, with `--no-write` and `--dry-run`
  equivalents for agent safety.
- Add a theme pass for color tags and accessible non-color labels.
- Add responsive breakpoints: table, split-pane, stacked-pane, and single-card.

## Agent UI

- Add `flourisher describe browse-actions` so agents can discover the non-TTY
  equivalents of interactive actions.
- Add `--output ndjson` for paged result streaming.
- Add schema versions to every JSON payload.
- Add `--dry-run` before any future mutation, including notes, stars, saved
  searches, or backend writes.
- Add replayable browser state: `--selected`, `--marked`, `--hidden`,
  `--command`, `--filter`, and future `--sort`.

## Demo Assets

- Capture narrow search output after the responsive fix.
- Capture compare-selected and command-prompt snapshots.
- Capture one real terminal screenshot with color enabled.
