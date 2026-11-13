"""Drift check: palette.json is the one vocabulary, and everything that names or uses a color follows it.

Usage: python3 tools/check.py [REPO_ROOT]
Prints one FAIL line per drift and exits 1, or prints ok and exits 0.

1. One name per value: every palette key is an opaque six-digit hex, and no two keys share one.
2. Every color the theme sets is a rung, and every rung is set somewhere. An alpha on a rung counts as that rung;
   black at a partial alpha is a shadow, not a rung.
3. The README ladder table has one row per key, in palette order, with that key's hex and the numbers colortool
   prints (Lc shown unless under 15).
4. Every token rule is named "<what> — <key>[, note]", with the key of its foreground.
5. Every fill, stroke and stop-color in assets/logo.svg is a rung, none or a url().
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import TYPE_CHECKING, NamedTuple, TypedDict

from colortool import apca, hex_to_oklch

if TYPE_CHECKING:
    from collections.abc import Iterator

Palette = dict[str, str]  # key -> '#RRGGBB', in the file's order
KeyOf = dict[str, str]  # '#RRGGBB' -> its key

_HEX = re.compile(r"#([0-9A-Fa-f]{3,4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})")
_TABLE = re.compile(r"\n\| key \|[^\n]*\n\|[-:| ]*\n(.*?)\n\n", re.DOTALL)
_TABLE_ROW = re.compile(
    r"^\| `(\w+)` \| .*? \| `(#[0-9A-Fa-f]{6})` \| ([0-9.]+) \| ([0-9.]+) \| (—|\d+) \| (—|\d+) \|$",
)
_RULE_NAME = re.compile(r"^.+? — (\w+)(?:, .*)?$")
_SVG_COLOR = re.compile(r"\b(?:fill|stroke|stop-color)\s*[=:]\s*\"?([^\";]+)")
_GRAY_CHROMA = 0.005  # below this chroma the table shows 0 and no hue
_LC_SHOWN = 15  # below this APCA Lc the table shows —


# The theme file's shape, as far as the checks read it. The keys are VS Code's own, hence camelCase; a color can be a JSON null.
class TokenSettings(TypedDict, total=False):
    foreground: str | None
    background: str | None
    fontStyle: str


class TokenRule(TypedDict, total=False):
    name: str
    scope: str | list[str]
    settings: TokenSettings


class SemanticStyle(TypedDict, total=False):
    foreground: str | None
    fontStyle: str


class Theme(TypedDict, total=False):
    name: str
    colors: dict[str, str | None]
    tokenColors: list[TokenRule]
    semanticTokenColors: dict[str, str | SemanticStyle | None]


class Hex(NamedTuple):
    base: str  # '#RRGGBB', upper case
    alpha: str | None  # 'AA', or None when the value has no alpha


def parse_hex(value: str | None) -> Hex | None:
    """'#RGB', '#RGBA', '#RRGGBB' or '#RRGGBBAA' as its six-digit base and its alpha; None if not a hex color."""
    match = _HEX.fullmatch(value or "")
    if not match:
        return None
    digits = match.group(1).upper()
    if len(digits) <= 4:
        digits = "".join(digit * 2 for digit in digits)
    return Hex("#" + digits[:6], digits[6:] or None)


def theme_colors(theme: Theme) -> Iterator[tuple[str, str | None]]:
    """Every color string the theme sets, with where it sits. Names and scopes are not colors."""
    for key, value in theme.get("colors", {}).items():
        yield f"colors.{key}", value
    for i, rule in enumerate(theme.get("tokenColors", [])):
        settings = rule.get("settings", {})
        if "foreground" in settings:
            yield f"tokenColors[{i}].foreground", settings["foreground"]
        if "background" in settings:
            yield f"tokenColors[{i}].background", settings["background"]
    for key, value in theme.get("semanticTokenColors", {}).items():
        if isinstance(value, str):
            yield f"semanticTokenColors.{key}", value
        elif isinstance(value, dict) and "foreground" in value:
            yield f"semanticTokenColors.{key}.foreground", value["foreground"]


def check_names(palette: Palette) -> tuple[KeyOf, list[str]]:
    """1. One name per value. Returns each rung's key, by hex, for the checks after it."""
    fails: list[str] = []
    keys_by_hex: dict[str, list[str]] = {}
    for key, value in palette.items():
        parsed = parse_hex(value)
        if not parsed or parsed.alpha is not None:
            fails.append(f"palette: {key} is not an opaque six-digit hex: {value}")
            continue
        keys_by_hex.setdefault(parsed.base, []).append(key)
    fails.extend(
        f"palette: {hex_} has two names: {', '.join(keys)}" for hex_, keys in keys_by_hex.items() if len(keys) > 1
    )
    if "ground" not in palette:
        fails.append("palette: no ground key, the background the README table's Lc is read against")
    return {hex_: keys[0] for hex_, keys in keys_by_hex.items()}, fails


def check_theme(theme: Theme, key_of: KeyOf) -> list[str]:
    """2. Every color the theme sets is a rung, and every rung is set somewhere."""
    fails: list[str] = []
    used: set[str] = set()
    for where, value in theme_colors(theme):
        parsed = parse_hex(value)
        if not parsed:
            fails.append(f"theme: {where} is not a hex color: {value!r}")
            continue
        if parsed.base == "#000000" and parsed.alpha not in {None, "FF"}:
            continue  # a shadow
        if parsed.base not in key_of:
            fails.append(f"theme: {where} = {value} is not in palette.json")
        used.add(parsed.base)
    fails.extend(f"palette: {key_of[hex_]} {hex_} is not used by the theme" for hex_ in sorted(set(key_of) - used))
    return fails


def table_numbers(hex_: str, ground: str) -> tuple[str, str, str, str]:
    """The README table's OKLCH L, chroma, hue and APCA Lc columns for a rung, as colortool computes them."""
    lightness, chroma, hue = hex_to_oklch(hex_)
    lc = abs(apca(hex_, ground))
    gray = chroma < _GRAY_CHROMA
    return (
        f"{lightness:.2f}",
        "0" if gray else f"{chroma:.3f}",
        "—" if gray else f"{hue:.0f}",
        "—" if lc < _LC_SHOWN else f"{lc:.0f}",
    )


def check_readme(readme: str, palette: Palette) -> list[str]:
    """3. The README ladder table: one row per key, in palette order, with the right hex and colortool's numbers."""
    table = _TABLE.search(readme)
    if not table:
        return ['README: no ladder table whose header starts with "| key |"']
    fails: list[str] = []
    seen: list[str] = []
    for line in table.group(1).split("\n"):
        row = _TABLE_ROW.match(line)
        if not row:
            fails.append(f"README table: row does not parse: {line[:60]}")
            continue
        key, hex_, *numbers = row.groups()
        seen.append(key)
        if key not in palette:
            fails.append(f"README table: {key} is not in palette.json")
            continue
        if hex_.upper() != palette[key].upper():
            fails.append(f"README table: {key} shows {hex_}, palette has {palette[key]}")
            continue
        if "ground" not in palette:
            continue  # reported under 1; the numbers have no background to be read against
        got, want = tuple(numbers), table_numbers(hex_, palette["ground"])
        if got != want:
            fails.append(f"README table: {key} numbers {got} should be {want}")
    if seen != list(palette):
        missing = [key for key in palette if key not in seen]
        extra = [key for key in seen if key not in palette]
        fails.append(
            "README table: rows must be the palette keys in palette order"
            + (f"; missing {missing}" if missing else "")
            + (f"; extra {extra}" if extra else "")
            + ("" if missing or extra else "; same keys, wrong order"),
        )
    return fails


def check_rule_names(theme: Theme, key_of: KeyOf) -> list[str]:
    """4. Every token rule is named "<what> — <key>[, note]", with the key of its foreground."""
    fails: list[str] = []
    for i, rule in enumerate(theme.get("tokenColors", [])):
        parsed = parse_hex(rule.get("settings", {}).get("foreground", ""))
        key = key_of.get(parsed.base) if parsed else None
        if key is None:
            continue  # no foreground, or one check 2 has already reported
        name = rule.get("name", "")
        named = _RULE_NAME.match(name)
        if not named:
            fails.append(f'token rule {i} "{name}": not of the form "<what> — <key>[, note]"')
        elif named.group(1) != key:
            fails.append(f'token rule {i} "{name}": names {named.group(1)}, its foreground is {key}')
    return fails


def check_logo(logo: Path, key_of: KeyOf) -> list[str]:
    """5. Every fill, stroke and stop-color in the logo is a rung, none or a url()."""
    if not logo.exists():
        return ["logo: assets/logo.svg is missing"]
    fails: list[str] = []
    for value in sorted({value.strip() for value in _SVG_COLOR.findall(logo.read_text())}):
        if value == "none" or re.fullmatch(r"url\(#[\w-]+\)", value):
            continue
        parsed = parse_hex(value)
        if not parsed:
            fails.append(
                f"logo: color {value!r} is not a six-digit hex (rgb(), hsl(), names and #RGB are not on the ladder)",
            )
        elif parsed.base not in key_of:
            fails.append(f"logo: {value} is not in palette.json")
    return fails


def check(root: Path) -> list[str]:
    palette: Palette = json.loads((root / "palette.json").read_text())
    theme: Theme = json.loads((root / "themes" / "blue-hour-color-theme.json").read_text())
    key_of, fails = check_names(palette)
    fails += check_theme(theme, key_of)
    fails += check_readme((root / "README.md").read_text(), palette)
    fails += check_rule_names(theme, key_of)
    fails += check_logo(root / "assets" / "logo.svg", key_of)
    return fails


def main() -> int:
    parser = argparse.ArgumentParser(description="Drift check: palette, theme, README table, token rule names, logo.")
    parser.add_argument("root", nargs="?", type=Path, default=Path(__file__).resolve().parent.parent)
    args = parser.parse_args()
    root: Path = args.root
    fails = check(root)
    for fail in fails:
        print("FAIL", fail)
    print(f"{len(fails)} failure(s)" if fails else "ok")
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main())
