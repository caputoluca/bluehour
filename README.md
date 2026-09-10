# Blue Hour

A dark colour theme for Cursor and VS Code. Flat near-black ground, a neutral lightness ladder that does most of the work, and two restrained accent families: cool for the language, warm for what you put in. The name is provisional (a naming pass is still owed); it comes from the sofa-at-blue-hour blue that became the accent.

**Where this stands (2026-09-09, late evening).** Version 0.2.0 is the v5 pass, packaged and installed in Cursor for a trial (`caputoluca.blue-hour-theme`, from the `.vsix`). The 0.1.0 trial found the code "clean and nice" but hard to read; an evening of probes showed the cause was segmentation, not contrast, and not habituation to Dark+ (record under v5 below). Luca judged 0.2.0 "honestly not that bad" and is trying it, with little code reading on right now. Dark+ stays installed and carries the Blue Hour status bar through `workbench.colorCustomizations` in user settings, so the frame is the same either way. Next steps, in order: (1) use it on real files for about a week; (2) the ground, still "a touch dark" and untouched because every other change was judged on it; (3) review, keep or close; (4) if kept, the naming pass, because the published id is permanent; (5) before anything goes public, split this README into a public README and a design-notes file, see the open list in `AGENTS.md`; (6) public GitHub repo with the `.vsix` on a release; (7) Open VSX only if the panel listing is wanted. Separate task once this settles: a dotfiles repo for Cursor settings, keybindings and an extensions list, since Cursor has no Settings Sync. Nothing is pushed anywhere yet; this repo has no remote.

## The system

Three ideas, borrowed from the room the palette came from:

- **The ground is the floor.** One flat near-black everywhere: editor, sidebar, tabs, panels, status bar. Hairlines separate areas, not gray panels.
- **Cool is the language, warm is what you put in.** Keywords and tags are a restrained blue; calls and types a lighter sky. Strings are the lamp peach; numbers, constants and escapes a quiet apricot. That is the whole colour budget: two families, four colours.
- **Everything else reads by lightness.** Names are the brightest neutral: variables, properties, parameters and plain text sit one rung under white. Punctuation and operators step down, so structure recedes and names come forward. Comments a quiet gray. Line numbers and guides lower still. On a line the rhythm is neutral name, sky call, neutral name: what Dark+ gets from blue and yellow, at a fraction of the chroma.

No italics, no bold except Markdown headings. Red exists only for errors, deletions and merge conflicts; it never appears in syntax.

## The ladder

Every value was designed in OKLCH (perceptual lightness) and checked with `tools/colortool.py` against the ground for WCAG ratio and APCA contrast. None is a photograph sample; the room gave the hue families, the ladder gave the values.

| role | hex | OKLCH L | chroma | APCA Lc |
| --- | --- | --- | --- | --- |
| ground | `#141414` | 0.19 | 0 | — |
| line highlight, inputs | `#1E1E1E` | 0.23 | 0 | — |
| hairlines, guides | `#2A2A2A` | 0.29 | 0 | — |
| line numbers, inactive | `#636363` | 0.50 | 0 | 21 |
| punctuation, operators, inactive tabs, breadcrumbs | `#929292` | 0.66 | 0 | 43 |
| comments | `#808080` | 0.60 | 0 | 34 |
| explorer and chrome text | `#C4C4C4` | 0.82 | 0 | 70 |
| names, plain code text | `#D4D4D4` | 0.87 | 0 | 80 |
| carets, bright white | `#E8E8E8` | 0.93 | 0 | 92 |
| keywords, tags | `#8EA7C4` | 0.72 | 0.05 | 53 |
| calls, types, decorators | `#A9D1EA` | 0.84 | 0.055 | 75 |
| strings | `#E6A68A` | 0.78 | 0.085 | 62 |
| numbers, constants, escapes, warnings | `#ECCAAD` | 0.86 | 0.055 | 77 |
| errors, deletions | `#DA827B` | 0.70 | 0.11 | 47 |

Targets came from the colour-systems brief: body text Lc ≥ 75, secondary ≥ 60, comments and punctuation 45–60. Comments sit a little under that floor on purpose, to be read second. 0.1.0 had names at 70, under the body-text floor; 0.2.0 moved them to 80. `palette.json` holds the same values by role name.

## Working on it

- **See it:** open this folder in Cursor and press F5, or from a terminal `cursor --extensionDevelopmentPath="$PWD" "$PWD/samples"`. The `samples/` folder pins the theme in that window only (`samples/.vscode/settings.json`), so the main window keeps whatever it had. Ten sample files cover TypeScript, TSX, Python, YAML, Markdown, JSON, shell, CSS, Prisma and SQL.
- **Tweak it:** each role is one hex in `themes/blue-hour-color-theme.json`, repeated wherever the role appears. Change a role with a find-and-replace on its hex, then Cmd+R in the dev-host window (theme-file edits usually apply live; a reload never hurts). `Developer: Inspect Editor Tokens and Scopes` on any word shows which rule coloured it.
- **Check a colour:** `python3 tools/colortool.py '#141414' '#E6A68A'` prints OKLCH, WCAG and APCA against the ground.
- **Install it for real:** `npx @vscode/vsce package` then `cursor --install-extension blue-hour-theme-0.2.0.vsix`. Switch with Cmd+K Cmd+T; Dark+ stays installed.
- **Leak check before publishing:** with the theme active, run `Developer: Generate Color Theme From Current Settings`; every commented-out line is a colour still falling back to stock VS Code.

## Publishing, when the time comes

Cursor's extension panel reads the Open VSX registry, not Microsoft's marketplace, so a marketplace-only theme never shows up in Cursor. Order: Open VSX first (Eclipse account, publisher agreement, namespace, `ovsx publish`), the Microsoft marketplace second (`vsce publish`; its Azure token path retires 2026-12-01, Entra auth after), and the `.vsix` on a GitHub release for `cursor --install-extension`. The published id `publisher.name` is permanent, which is why the naming pass comes before this step. Sources and grades: `~/projects/craft/briefs/vscode-theme-authoring-2026.md`.

## How it got here

Four versions in one evening and a fifth the next, all on the same ten sample files. The record matters more than the files, so the dead ones were deleted and the reasons kept:

1. **v1 — verbatim room swatches on a monochrome scheme.** Read flat: three near-whites within a hair of each other, and the sampled near-black had a blue cast. Photographed paint and fabric are low in chroma; on a screen next to Dark+ they wash out.
2. **v2 — Dark+'s role structure with the nearest swatch for each role.** Read as "colours thrown together"; the baby-blue variables were the clearest case of a swatch with no reason to be on that word. A mapping is not a design.
3. **v3 — the blueprint done properly, six full hues on a designed ladder.** Solved reading ("100x easier") and produced a generic theme, because six full hues is Dark+'s own recipe. No specialness.
4. **v4 — the same ladder, two accents, flat near-black.** "Really nice and cool." Kept as 0.1.0.
5. **v5 — same palette, names up a rung, calls onto the sky, frame lifted.** The 0.1.0 trial: "really clean and nice" but hard to read, and unsure whether that was habituation. Probes on the same file settled it. Vesper (two hues, white text, Lc 107) was also hard; GitHub Dark read easily; One Dark Pro was "too much going on". Contrast did not track the verdicts, hue count did, and a new many-hue theme reading fine on first sight ruled out habituation: Luca reads by hue, and the line had no cues ("my brain is searching for hints via the colors and not finding any"). The colour-systems brief then corrected the first fix: four of seven good themes leave variables plain and hue functions instead. Tried on names and rejected: lavender ("a bit better", wrong vibe: the room has no purple), tan, cream; the ladder's top white ("jarring/laggy when I scroll") stepped down to Dark+'s own `#D4D4D4`. Calls moved from white to the sky, shared with types as Vesper and GitHub Dark do: "a bit better, but now too much blue". Two ways out of the blue were tried and rejected: keywords to a neutral (Vesper's move) and calls to the apricot ("calls should stay on blue, it's the main colour"). Back to calls-on-sky: "honestly isn't that bad". Frame: explorer text, inactive tabs and breadcrumbs sat far below Dark+ (Lc 43 and 21 against about 75 and 40) and came up; both carets and the activity-bar badge lost the peach, so warm in the frame now only means attention (warnings, ANSI yellow, the Claude Code prompt). The ground was not touched. Two hybrids (this frame with Dark+ code, and with GitHub Dark code) were built and shown: both read "bright and too dark at once" on `#141414`, a ground darker than either syntax set was designed for. Deleted; the lesson is the ground, not the hybrids.

Two chrome-only fallbacks were also built and shown (Dark+ code with this frame; Dark+ with only the status bar changed) and are documented here so nobody rebuilds them: they read fine but "not different enough to switch". Research behind the blueprint: `~/projects/craft/briefs/theme-colour-systems-2026.md` (seven themes' own role mappings, the reading evidence, the ladder science).
