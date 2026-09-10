# Blue Hour — maintainer notes

One theme, one JSON, no build step (single variant → plain JSON, per the authoring brief in craft). Source of truth is `themes/blue-hour-color-theme.json`; `palette.json` documents the roles.

- **Layout:** `package.json` (manifest, one `contributes.themes` entry) · `themes/` · `samples/` (dev-host workspace, pins the theme) · `tools/colortool.py` (OKLCH / WCAG / APCA checker) · `.vscode/launch.json` (F5).
- **Commands:** F5 or `cursor --extensionDevelopmentPath="$PWD" "$PWD/samples"` to look; `npx @vscode/vsce package` to build a `.vsix`; `cursor --install-extension <file>.vsix` to install.
- **Rules:** every colour is designed on the ladder and checked with the tool before it goes in — no eyeballed hex, no verbatim photo samples. Red only for errors and deletions. No italics. Keep the README's "Where this stands" line current; it is the pick-up point.
- **Open:** the ground (a touch dark, untested); trial from 2026-09-09 on real files, review after about a week; naming pass; before going public, split the README into a public README (the system, the ladder, install) and a separate design-notes file holding the version record, rewritten without quotes or working state; public GitHub repo with the `.vsix` on a release; Open VSX decision.
