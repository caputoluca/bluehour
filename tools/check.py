#!/usr/bin/env python3
"""Drift check. palette.json is the one vocabulary; the theme file and the README ladder table follow it.
Usage: python3 tools/check.py [repo-root]. Exits 1 with one line per failure.

Checks: one name per value · every colour the theme sets is a palette rung (black at a partial alpha is a shadow, not a rung;
an alpha on a rung counts as that rung) · every rung is used · the README table has one row per key, in palette order, with
that key's hex and the numbers colortool prints (Lc shown unless under 15) · every token rule is named "<what> — <key>[, note]"
with the key of its foreground."""
import json, pathlib, re, sys

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from colortool import apca, hex_to_oklch  # noqa: E402

root = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else HERE.parent
palette = json.loads((root / 'palette.json').read_text())
theme = json.loads((root / 'themes' / 'blue-hour-color-theme.json').read_text())
readme = (root / 'README.md').read_text()
GROUND = palette.get('ground', '#141414')
fails = []


def parse_hex(value):
    """'#RGB' | '#RGBA' | '#RRGGBB' | '#RRGGBBAA' -> ('#RRGGBB', 'AA' or None); None if not a hex colour."""
    m = re.fullmatch(r'#([0-9A-Fa-f]{3,4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})', value or '')
    if not m:
        return None
    digits = m.group(1).upper()
    if len(digits) <= 4:
        digits = ''.join(d * 2 for d in digits)
    return '#' + digits[:6], (digits[6:] or None)


def colour_values(t):
    """Every colour string the theme sets, with where it sits. Names and scopes are not colours."""
    for key, value in t.get('colors', {}).items():
        yield f'colors.{key}', value
    for i, rule in enumerate(t.get('tokenColors', [])):
        for field in ('foreground', 'background'):
            if field in rule.get('settings', {}):
                yield f'tokenColors[{i}].{field}', rule['settings'][field]
    for key, value in t.get('semanticTokenColors', {}).items():
        if isinstance(value, str):
            yield f'semanticTokenColors.{key}', value
        elif isinstance(value, dict) and 'foreground' in value:
            yield f'semanticTokenColors.{key}.foreground', value['foreground']


# 1. one name per value
names_by_hex = {}
for key, hex_ in palette.items():
    parsed = parse_hex(hex_)
    if not parsed or parsed[1] is not None:
        fails.append(f'palette: {key} is not an opaque six-digit hex: {hex_}')
        continue
    names_by_hex.setdefault(parsed[0], []).append(key)
for hex_, keys in names_by_hex.items():
    if len(keys) > 1:
        fails.append(f'palette: {hex_} has two names: {", ".join(keys)}')
key_of = {hex_: keys[0] for hex_, keys in names_by_hex.items()}

# 2. every colour the theme sets is a rung, and every rung is set somewhere
used = set()
for where, value in colour_values(theme):
    parsed = parse_hex(value)
    if not parsed:
        fails.append(f'theme: {where} is not a hex colour: {value!r}')
        continue
    base, alpha = parsed
    if base == '#000000' and alpha is not None and alpha != 'FF':
        continue
    if base not in key_of:
        fails.append(f'theme: {where} = {value} is not in palette.json')
    used.add(base)
for hex_ in sorted(set(key_of) - used):
    fails.append(f'palette: {key_of[hex_]} {hex_} is not used by the theme')

# 3. the README ladder table: one row per key, palette order, right hex, colortool's numbers
table = re.search(r'\n\| key \|[^\n]*\n\|[ -|]*\n(.*?)\n\n', readme, re.S)
if not table:
    fails.append('README: no ladder table whose header starts with "| key |"')
else:
    row_re = re.compile(r'^\| `(\w+)` \| .*? \| `(#[0-9A-Fa-f]{6})` \| ([0-9.]+) \| ([0-9.]+) \| (—|\d+) \| (—|\d+) \|$')
    seen = []
    for line in table.group(1).split('\n'):
        m = row_re.match(line)
        if not m:
            fails.append(f'README table: row does not parse: {line[:60]}')
            continue
        key, hex_, L, C, hue, lc = m.groups()
        seen.append(key)
        if key not in palette:
            fails.append(f'README table: {key} is not in palette.json')
            continue
        if hex_.upper() != palette[key].upper():
            fails.append(f'README table: {key} shows {hex_}, palette has {palette[key]}')
            continue
        l_, c_, h_ = hex_to_oklch(hex_)
        lc_ = abs(apca(hex_, GROUND))
        want = (f'{l_:.2f}', '0' if c_ < 0.005 else f'{c_:.3f}', '—' if c_ < 0.005 else f'{h_:.0f}', '—' if lc_ < 15 else f'{lc_:.0f}')
        got = (L, C, hue, lc)
        if got != want:
            fails.append(f'README table: {key} numbers {got} should be {want}')
    if seen != list(palette):
        missing = [k for k in palette if k not in seen]
        extra = [k for k in seen if k not in palette]
        fails.append('README table: rows must be the palette keys in palette order'
                     + (f'; missing {missing}' if missing else '') + (f'; extra {extra}' if extra else '')
                     + ('' if missing or extra else '; same keys, wrong order'))

# 4. every token rule is named "<what> — <key>[, note]" with the key of its foreground
name_re = re.compile(r'^.+? — (\w+)(?:, .*)?$')
for i, rule in enumerate(theme.get('tokenColors', [])):
    fg = rule.get('settings', {}).get('foreground')
    if not fg:
        continue
    name = rule.get('name', '')
    parsed = parse_hex(fg)
    key = key_of.get(parsed[0]) if parsed else None
    m = name_re.match(name)
    if key is None:
        continue  # already reported under 2
    if not m:
        fails.append(f'token rule {i} "{name}": not of the form "<what> — <key>[, note]"')
    elif m.group(1) != key:
        fails.append(f'token rule {i} "{name}": names {m.group(1)}, its foreground is {key}')

for f in fails:
    print('FAIL', f)
print('ok' if not fails else f'{len(fails)} failure(s)')
sys.exit(1 if fails else 0)
