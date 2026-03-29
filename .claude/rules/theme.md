---
paths:
  - "components/**"
  - "app/**/*.tsx"
  - "app/globals.css"
description: Linux terminal aesthetic — dark monospace UI rules
---

# Terminal Theme Rules

## Visual Constraints

- Dark background (near-black), green/amber/white foreground text
- Monospace font everywhere (JetBrains Mono or Fira Code). Proportional only for long-form recipe body if readability demands it.
- `--radius: 0` — no rounded corners anywhere
- No box shadows, no gradients, no blur effects
- Borders: 1px solid, styled to evoke ASCII box-drawing (`┌─┐│└─┘`)
- No icon libraries — use ASCII symbols (`[+]`, `[x]`, `>>`, `--`) or text labels

## Component Patterns

- Buttons render as `[ Save ]` or `> Submit` — flat, bordered, monospace
- Inputs look like terminal prompts with a cursor
- Hover: underline or inverse colors (swap fg/bg)
- Focus: block cursor animation
- Errors: red text prefixed with `ERR:`
- Success: green text
- Loading: spinner like `[ ... ]` or braille dots

## Layout

- Breadcrumbs as file paths: `~/cookbooks/italian/mains/`
- Recipe listings as columnar terminal output (like `ls -la`)
- Diffs look like `git diff` — green/red lines, `@@` hunk headers
- History looks like `git log --oneline`
- Branch switcher shows `*` on current branch

## shadcn CSS Variables

Override in `.dark` block:
- `--background`: near-black (e.g., `oklch(0.08 0 0)`)
- `--foreground`: terminal green or light gray
- `--primary`: accent green/amber
- `--border`: subtle dark border
- `--radius`: `0rem`
- `--destructive`: terminal red
