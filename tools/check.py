#!/usr/bin/env python3
"""Drift check. palette.json is the one vocabulary; the theme file and the README ladder table follow it.
Usage: python3 tools/check.py [repo-root]. Exits 1 with one line per failure."""
import json, pathlib, re, sys

root = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else pathlib.Path(__file__).resolve().parent.parent)
palette = json.loads((root / 'palette.json').read_text())
theme = json.loads((root / 'themes' / 'blue-hour-color-theme.json').read_text())
readme = (root / 'README.md').read_text()
fails = []

# 1. one name per value: no dead aliases
names_by_hex = {}
for key, hex_ in palette.items():
    names_by_hex.setdefault(hex_.upper(), []).append(key)
for hex_, keys in names_by_hex.items():
    if len(keys) > 1:
        fails.append(f'palette: {hex_} has two names: {", ".join(keys)}')
key_of = {hex_.upper(): keys[0] for hex_, keys in names_by_hex.items()}

# 2. every opaque colour the theme uses is a palette value, and every palette value is used
used = set()
for m in re.finditer(r'#([0-9A-Fa-f]{6})([0-9A-Fa-f]{2})?', json.dumps(theme)):
    base, alpha = '#' + m.group(1).upper(), m.group(2)
    if base == '#000000' and alpha:
        continue  # black at an alpha is a shadow or "transparent", not a rung
    used.add(base)
for hex_ in sorted(used - set(key_of)):
    fails.append(f'theme: {hex_} is not in palette.json')
for hex_ in sorted(set(key_of) - used):
    fails.append(f'palette: {key_of[hex_]} {hex_} is not used by the theme')

# 3. the README ladder table names every key and hex, and nothing else
table = re.search(r'\n\| key \|.*?\n\n', readme, re.S)
if not table:
    fails.append('README: no ladder table whose header starts with "| key |"')
else:
    body = table.group(0)
    for key, hex_ in palette.items():
        if f'`{key}`' not in body:
            fails.append(f'README table: missing key {key}')
        if hex_.upper() not in body.upper():
            fails.append(f'README table: missing hex {hex_} ({key})')
    for hex_ in re.findall(r'#[0-9A-Fa-f]{6}', body):
        if hex_.upper() not in key_of:
            fails.append(f'README table: {hex_} is not in palette.json')

# 4. every token rule names the palette key of its foreground
for rule in theme.get('tokenColors', []):
    fg = rule.get('settings', {}).get('foreground')
    if not fg:
        continue
    name = rule.get('name', '')
    key = key_of.get(fg.upper())
    if key is None:
        fails.append(f'token rule "{name}": {fg} is not in palette.json')
    elif not re.search(rf'\b{re.escape(key)}\b', name):
        fails.append(f'token rule "{name}": does not name its colour, {key}')

for f in fails:
    print('FAIL', f)
print('ok' if not fails else f'{len(fails)} failure(s)')
sys.exit(1 if fails else 0)
