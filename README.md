# Blue Hour

A dark colour theme for Cursor and VS Code. Flat near-black ground, a neutral lightness ladder that does most of the work, and two restrained accent families: cool for the language, warm for what you put in. The name is provisional (a naming pass is still owed); it comes from the sofa-at-blue-hour blue that became the accent.

**Where this stands (2026-09-08, late evening).** Version 0.1.0 is approved as a *trial*, not a final. Luca liked it more than Dark+ on first look, said the ground feels a touch dark and that he has "a few tweaks here and there". Next steps, in order: (1) the tweaks, one at a time; (2) package and install it in the real Cursor so the trial runs on real files with Dark+ one keystroke away; (3) review after about a week of use; (4) if it stuck: naming pass, then publish (Open VSX first, see below). Nothing is pushed anywhere yet; this repo has no remote.

## The system

Three ideas, borrowed from the room the palette came from:

- **The ground is the floor.** One flat near-black everywhere: editor, sidebar, tabs, panels, status bar. Hairlines separate areas, not gray panels.
- **Cool is the language, warm is what you put in.** Keywords and tags are a restrained blue; types a lighter sky. Strings are the lamp peach; numbers, constants and escapes a quiet apricot. That is the whole colour budget: two families, four colours.
- **Everything else reads by lightness.** Function names are the whitest thing on screen. Variables, properties and parameters one step down. Punctuation and operators another step down, so structure recedes and names come forward. Comments a quiet gray. Line numbers and guides lower still.

No italics, no bold except Markdown headings. Red exists only for errors and deletions; it never appears in syntax.

## The ladder

Every value was designed in OKLCH (perceptual lightness) and checked with `tools/colortool.py` against the ground for WCAG ratio and APCA contrast. None is a photograph sample; the room gave the hue families, the ladder gave the values.

| role | hex | OKLCH L | chroma | APCA Lc |
| --- | --- | --- | --- | --- |
| ground | `#141414` | 0.19 | 0 | — |
| line highlight, inputs | `#1E1E1E` | 0.23 | 0 | — |
| hairlines, guides | `#2A2A2A` | 0.29 | 0 | — |
| line numbers, inactive | `#636363` | 0.50 | 0 | 21 |
| punctuation, operators | `#929292` | 0.66 | 0 | 43 |
| comments | `#808080` | 0.60 | 0 | 34 |
| text, variables, properties | `#C4C4C4` | 0.82 | 0 | 70 |
| functions, decorators | `#E8E8E8` | 0.93 | 0 | 92 |
| keywords, tags | `#8EA7C4` | 0.72 | 0.05 | 53 |
| types | `#A9D1EA` | 0.84 | 0.055 | 75 |
| strings | `#E6A68A` | 0.78 | 0.085 | 62 |
| numbers, constants, escapes | `#ECCAAD` | 0.86 | 0.055 | 77 |
| errors, deletions | `#DA827B` | 0.70 | 0.11 | 47 |

Targets came from the colour-systems brief: body text Lc ≥ 75, secondary ≥ 60, comments and punctuation 45–60. Comments sit a little under that floor on purpose, to be read second. `palette.json` holds the same values by role name.

## Working on it

- **See it:** open this folder in Cursor and press F5, or from a terminal `cursor --extensionDevelopmentPath="$PWD" "$PWD/samples"`. The `samples/` folder pins the theme in that window only (`samples/.vscode/settings.json`), so the main window keeps whatever it had. Ten sample files cover TypeScript, TSX, Python, YAML, Markdown, JSON, shell, CSS, Prisma and SQL.
- **Tweak it:** each role is one hex in `themes/blue-hour-color-theme.json`, repeated wherever the role appears. Change a role with a find-and-replace on its hex, then Cmd+R in the dev-host window (theme-file edits usually apply live; a reload never hurts). `Developer: Inspect Editor Tokens and Scopes` on any word shows which rule coloured it.
- **Check a colour:** `python3 tools/colortool.py '#141414' '#E6A68A'` prints OKLCH, WCAG and APCA against the ground.
- **Install it for real:** `npx @vscode/vsce package` then `cursor --install-extension blue-hour-theme-0.1.0.vsix`. Switch with Cmd+K Cmd+T; Dark+ stays installed.
- **Leak check before publishing:** with the theme active, run `Developer: Generate Color Theme From Current Settings`; every commented-out line is a colour still falling back to stock VS Code.

## Publishing, when the time comes

Cursor's extension panel reads the Open VSX registry, not Microsoft's marketplace, so a marketplace-only theme never shows up in Cursor. Order: Open VSX first (Eclipse account, publisher agreement, namespace, `ovsx publish`), the Microsoft marketplace second (`vsce publish`; its Azure token path retires 2026-12-01, Entra auth after), and the `.vsix` on a GitHub release for `cursor --install-extension`. The published id `publisher.name` is permanent, which is why the naming pass comes before this step. Sources and grades: `~/projects/craft/briefs/vscode-theme-authoring-2026.md`.

## How it got here

Four versions in one evening, all on the same ten sample files. The record matters more than the files, so the dead ones were deleted and the reasons kept:

1. **v1 — verbatim room swatches on a monochrome scheme.** Read flat: three near-whites within a hair of each other, and the sampled near-black had a blue cast. Photographed paint and fabric are low in chroma; on a screen next to Dark+ they wash out.
2. **v2 — Dark+'s role structure with the nearest swatch for each role.** Read as "colours thrown together"; the baby-blue variables were the clearest case of a swatch with no reason to be on that word. A mapping is not a design.
3. **v3 — the blueprint done properly, six full hues on a designed ladder.** Solved reading ("100x easier") and produced a generic theme, because six full hues is Dark+'s own recipe. No specialness.
4. **v4 — the same ladder, two accents, flat near-black.** "Really nice and cool." Kept.

Two chrome-only fallbacks were also built and shown (Dark+ code with this frame; Dark+ with only the status bar changed) and are documented here so nobody rebuilds them: they read fine but "not different enough to switch". Research behind the blueprint: `~/projects/craft/briefs/theme-colour-systems-2026.md` (seven themes' own role mappings, the reading evidence, the ladder science).
