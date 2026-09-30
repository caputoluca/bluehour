![Blue Hour](assets/hero.png)
<sub>Geist Mono. Shown: `samples/blue-hour.ts`, coloured by the theme itself.</sub>

# Blue Hour

A dark theme for Cursor and VS Code: one flat near-black, a neutral lightness ladder that does most of the work, and two restrained accent families, cool for the language and warm for what you put in.

v0.2.7 · one dark variant · in daily use since 2026-09-10.

## Install

- Cursor: [Open VSX](https://open-vsx.org/extension/caputoluca/blue-hour-theme) · VS Code: [Marketplace](https://marketplace.visualstudio.com/items?itemName=caputoluca.blue-hour-theme) · or the `.vsix` from [Releases](https://github.com/caputoluca/blue-hour/releases), via `Extensions: Install from VSIX…`
- Then `Cmd+K Cmd+T` and pick Blue Hour. Try it without installing: [vscode.dev](https://vscode.dev/editor/theme/caputoluca.blue-hour-theme).

## The system

- **The ground is the floor.** One flat near-black everywhere: editor, sidebar, tabs, panels, status bar. Hairlines separate areas, not gray panels.
- **Cool is the language, warm is what you put in.** Keywords and tags a restrained blue, calls and types a lighter sky; strings a lamp peach, numbers and constants a quiet apricot. Two families, four colours, and that is the whole budget.
- **Everything else reads by lightness.** Names are the brightest neutral; punctuation and operators a rung down, so structure recedes and names come forward; comments quieter; line numbers and guides lower still. On a line the rhythm is neutral name, sky call, neutral name. That is what Dark+ gets from blue and yellow, at a fraction of the chroma.
- No italics, and no bold in syntax except Markdown headings; Markdown's own emphasis renders as written. Red only for errors, invalid code, deletions and merge conflicts.

## The ladder

Every value was designed in OKLCH and checked against the ground with [`tools/colortool.py`](tools/colortool.py) for WCAG ratio and APCA contrast. Targets: body text Lc ≥ 75, secondary text ≥ 60, comments and punctuation 45–60, with comments a little under that floor on purpose, to be read second. None of the values is a photograph sample: the room gave the hue families, the ladder gave the numbers.

| key | used for | hex | OKLCH L | chroma | hue | APCA Lc |
| --- | --- | --- | --- | --- | --- | --- |
| `ground` | editor, sidebar, tabs, panels, status bar, terminal; text on badges and buttons; ANSI black | `#141414` | 0.19 | 0 | — | — |
| `raised` | line highlight, inputs, hover, inactive list selection | `#1D1D1D` | 0.23 | 0 | — | — |
| `hairline` | borders, guides, whitespace, secondary buttons | `#2B2B2B` | 0.29 | 0 | — | — |
| `muted` | line numbers, inactive frame text, placeholders, hints, scrollbars, the active tab's line; ANSI bright black | `#636363` | 0.50 | 0 | — | 21 |
| `comment` | comments, docstrings, block quotes | `#808080` | 0.60 | 0 | — | 34 |
| `subtle` | punctuation, operators, the active line number, inactive tabs, breadcrumbs, icons, bracket pairs 1 and 4 | `#929292` | 0.66 | 0 | — | 43 |
| `frame` | frame text you read: explorer, status bar, headers, the active tab's label; default editor and terminal text; ANSI white | `#C4C4C4` | 0.82 | 0 | — | 70 |
| `text` | names: variables, properties, parameters | `#D4D4D4` | 0.87 | 0 | — | 80 |
| `bright` | carets, Markdown headings; ANSI bright white | `#E8E8E8` | 0.93 | 0 | — | 92 |
| `blue` | keywords, tags, focus, badges, links, primary buttons, info, the gutter's modified bar, bracket pairs 2 and 5; ANSI blue | `#8EA7C4` | 0.72 | 0.051 | 252 | 53 |
| `sky` | calls, types, decorators, link hover; ANSI cyan | `#A9D1EA` | 0.84 | 0.055 | 236 | 75 |
| `peach` | strings, matched text in lists, progress bar | `#E6A68A` | 0.78 | 0.085 | 45 | 61 |
| `gold` | numbers, constants, escapes, warnings, git modified, bracket pairs 3 and 6; ANSI yellow | `#ECCAAD` | 0.86 | 0.055 | 62 | 77 |
| `red` | errors, deletions, conflicts, invalid; ANSI red | `#DA827B` | 0.70 | 0.110 | 25 | 47 |
| `green` | additions, untracked, diff inserted; ANSI green | `#92BE9A` | 0.76 | 0.069 | 150 | 61 |
| `magenta` | ANSI magenta only | `#BAA8D0` | 0.76 | 0.060 | 305 | 58 |
| `highlight_low` | inactive selection, the explorer's open file, word and bracket match, other find matches, list and menu focus, the status bar while debugging | `#1E2A37` | 0.28 | 0.029 | 251 | — |
| `highlight_mid` | selection, strong word match, terminal selection | `#26394F` | 0.34 | 0.046 | 253 | — |
| `highlight_high` | the current find match | `#344F6D` | 0.42 | 0.060 | 252 | — |
| `red_bright` | ANSI bright red (the Claude Code spark) | `#F19E97` | 0.78 | 0.100 | 25 | 61 |
| `green_bright` | ANSI bright green | `#ABD8B3` | 0.84 | 0.070 | 150 | 76 |
| `gold_bright` | ANSI bright yellow | `#FFDEBA` | 0.92 | 0.060 | 69 | 89 |
| `blue_bright` | ANSI bright blue | `#ADC7E4` | 0.82 | 0.050 | 251 | 70 |
| `magenta_bright` | ANSI bright magenta | `#D2C3E5` | 0.84 | 0.049 | 305 | 73 |
| `sky_bright` | ANSI bright cyan | `#BFE4FB` | 0.90 | 0.050 | 235 | 86 |

Frame text you read sits one rung below the code; frame state (inactive tabs, breadcrumbs, line numbers, placeholders) a rung below that. The terminal is the one place the two-family budget is exceeded, because ANSI wants eight hues: `green` and `magenta` exist for it, and each bright is its base one rung up. `palette.json` holds these values under these names, the theme file's token rules carry them too, and `python3 tools/check.py` fails when any of the three drifts.

## Working on it

- **See it:** open this folder in Cursor and press F5, or `cursor --extensionDevelopmentPath="$PWD" "$PWD/samples"`. The `samples/` folder pins the theme to that window only; ten files cover TypeScript, TSX, Python, YAML, Markdown, JSON, shell, CSS, Prisma and SQL.
- **Check a colour:** `python3 tools/colortool.py '#141414' '#E6A68A'` prints OKLCH, WCAG and APCA against the ground. **Check the names:** `python3 tools/check.py`.
- **Build:** `npx @vscode/vsce package`, then `cursor --install-extension blue-hour-theme-<version>.vsix`.
- Rules, commands and the hero recipe: [`AGENTS.md`](AGENTS.md).

## Design notes

How it got here, what was tried and rejected, and the sources: [`design-notes.md`](design-notes.md). What shipped when: [`CHANGELOG.md`](CHANGELOG.md).

## Licence

MIT · © 2026 Luca Caputo
