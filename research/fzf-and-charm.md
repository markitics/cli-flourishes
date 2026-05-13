# fzf and Charm Tools

These tools are useful references for making terminals feel like applications.

## fzf

`fzf` is a general-purpose fuzzy finder. Its README emphasizes interactive
filtering over arbitrary lists, fast fuzzy matching, key bindings, multi-select,
preview windows, and alternate display modes such as partial-height and popup
layouts.

Flourisher ideas:

- Let the result browser filter in place without re-running the backend.
- Use `tab` or `space` for multi-select, then show `compare selected`.
- Add preview/detail windows for company profiles, products, and notes.
- Consider a future `--filter <term>` snapshot mode for deterministic demos.

Source: <https://github.com/junegunn/fzf>

## Charm Bubble Tea, Bubbles, Lip Gloss, and Gum

Charm's ecosystem is a reference point for polished TUIs. Bubble Tea provides a
model/update/view architecture, Bubbles provides common components such as text
inputs and spinners, Lip Gloss handles terminal layout/styling, and Gum exposes
attractive shell-script UI primitives.

Flourisher ideas:

- If this prototype becomes a real TUI, consider moving from hand-rendered
  frames to a TUI framework.
- Use component boundaries that mirror the UI: results list, detail pane,
  compare pane, command strip, footer.
- Keep deterministic snapshot rendering even if the implementation moves to a
  framework.

Sources:

- <https://github.com/charmbracelet/bubbletea>
- <https://github.com/charmbracelet/gum>

