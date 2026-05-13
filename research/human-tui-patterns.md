# Human TUI Patterns

Good terminal apps make state and available actions obvious without forcing the
user to remember flags. Flourisher should borrow these patterns.

## Patterns to Study

- Command strip: Claude Code's `/permissions` flow keeps a command/search line
  visible above the active list. Flourisher can use the same shape for `search
  products`, `ask question`, `compare selected`, and `remove from view`.
- Focused row plus detail pane: keep the list scannable, then show deeper data
  beside or below the selected row. On narrow terminals, stack the panes rather
  than wrapping table rows.
- Finite-state tags: render booleans and enums as compact tags such as
  `[SOC2]`, `[subscription]`, `[one-time payment]`, `[listed app]`, and
  `[unverified]`. These reduce cognitive load compared with raw yes/no columns.
- Footer with valid keys only: if two rows are not marked, do not show `compare
  selected`; once two are marked, surface it immediately.
- Reversible filters: `remove from view` should hide an incomplete row for the
  session, but `restore hidden` must be available so the user never fears losing
  data.

## Flourisher Implications

- Treat `browse` as the human command and `search --json` as the agent command.
- Keep snapshot flags for every visual state so documentation and tests can show
  the same UI without needing an interactive terminal.
- For terminal resize, prefer layout changes over truncating high-value fields.
  First switch table to cards, then switch split panes to stacked panes.

