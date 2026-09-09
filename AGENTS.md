# Blue Hour — maintainer notes

One theme, one JSON, no build step (single variant → plain JSON, per the authoring brief in craft). Source of truth is `themes/blue-hour-color-theme.json`; `palette.json` documents the roles.

- **Layout:** `package.json` (manifest, one `contributes.themes` entry) · `themes/` · `samples/` (dev-host workspace, pins the theme) · `tools/colortool.py` (OKLCH / WCAG / APCA checker) · `.vscode/launch.json` (F5).
- **Commands:** F5 or `cursor --extensionDevelopmentPath="$PWD" "$PWD/samples"` to look; `npx @vscode/vsce package` to build a `.vsix`; `cursor --install-extension <file>.vsix` to install.
- **Rules:** every colour is designed on the ladder and checked with the tool before it goes in — no eyeballed hex, no verbatim photo samples. Red only for errors and deletions. No italics. Keep the README's "Where this stands" line current; it is the pick-up point.
- **Open:** tweaks from the trial; install for real; one-week review; naming pass; publish (Open VSX first).
