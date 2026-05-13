# Feature: Human-Focused Terminal UI

## Research notes

The strongest human CLI examples treat the terminal as an application surface,
not just an output stream.

- Bubble Tea is a Go TUI framework based on the Elm Architecture. Its docs show
  a model/update/view loop with keyboard handling, including `j`/`k`, arrows,
  enter, and space for navigation and selection.
  Source: https://github.com/charmbracelet/bubbletea
- Bubbles supplies reusable Bubble Tea components, which matters if Flourisher
  grows into a full-screen result browser with tables, tabs, filters, and text
  input.
  Source: https://github.com/charmbracelet/bubbles
- Lip Gloss focuses on styling terminal layouts. It is useful if we choose Go
  and want borders, spacing, adaptive color, and polished panes without inventing
  a styling layer.
  Source: https://github.com/charmbracelet/lipgloss
- Textual offers Python terminal apps with widgets, CSS-like styling, reactive
  updates, and keyboard navigation.
  Source: https://textual.textualize.io/
- Ink brings React-style component composition to Node CLIs and is used by
  several modern agentic or developer CLIs. It is the most natural path if this
  repo stays Node-based.
  Source: https://github.com/vadimdemedes/ink
- Gum is useful for shell-script flourishes: spinners, choose menus, filters,
  confirmation prompts, and styled text without building a whole app framework.
  Source: https://github.com/charmbracelet/gum
- fzf remains the reference point for fast fuzzy filtering, preview panes, and
  keyboard-first list navigation.
  Source: https://github.com/junegunn/fzf

## Proposed flow

Add a separate interactive mode instead of making `search` itself full-screen by
default:

```sh
flourisher search "analytics" --interactive
flourisher browse "analytics"
```

Suggested controls:

- `j` / `k`: move between rows.
- `h` / `l`: move between column groups.
- `enter`: open a company detail panel.
- `esc`: close the panel or exit the app one level at a time.
- `space`: mark a company for comparison.
- `c`: copy profile link.
- `s`: star or save for later.
- `/`: refine the current query.
- `tab`: cycle between Results, Compare, Notes, and Filters.

## Detail panel

The detail panel should answer questions that do not fit in a table:

- Headquarters, company age, and team size.
- Stripe surfaces: app marketplace, Connect, Checkout, Payment Links, Terminal,
  Billing, Radar, data pipeline, or custom.
- Products sold and price model.
- Buyer profile and concrete use cases.
- Trust signals: verification source, link acceptance, response time, project
  history, last active date.
- Notes and saved comparison state.

## Current decision

Keep the default `search` command non-interactive and add the richer browser as
an explicit mode. The current implementation supports `flourisher browse
"analytics"` for a TTY browser and `--snapshot` for deterministic docs, tests,
and screenshot generation.

```sh
flourisher browse "analytics" --snapshot --selected vectorgrove --pane details
```

The table remains the stable fallback for CI, scripts, terminals without a TTY,
and demos where an agent cannot operate a full-screen app.

## Alternative

Build the first version directly in Ink or Bubble Tea. That would be more
impressive visually, but it would delay the boring contract work: hard-coded
data shape, output formats, tests, and docs.
