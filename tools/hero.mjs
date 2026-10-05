#!/usr/bin/env node
// Renders assets/hero.png (the README card, 2x) and assets/icon.png (the Marketplace icon) from the theme file:
// samples/blue-hour.ts coloured by Shiki with the theme's token rules, the window chrome from the theme's own colour keys,
// composed like Vesper's card, the logo from assets/logo.svg in the lockup. Nothing is a screenshot; `npm run hero` regenerates both.
import { createHighlighter } from 'shiki';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHROME = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const FILE = 'blue-hour.ts', LANG = 'ts', FROM = 1, TO = 33, CURRENT = 23;   // the evening, lines 1–33, the cursor on ceiling.off()
const CODE_FONT = 'Geist Mono';                                              // Luca's editor font; the render fails without it

const theme = JSON.parse(readFileSync(path.join(ROOT, 'themes/blue-hour-color-theme.json'), 'utf8'));
const c = theme.colors;
const ui = {                                     // every chrome colour is the theme's own key for that role
  ground: c['editor.background'],
  raised: c['editor.lineHighlightBackground'],
  hairline: c['editorGroup.border'],
  lineNumber: c['editorLineNumber.foreground'],
  activeLineNumber: c['editorLineNumber.activeForeground'],
  text: c['editor.foreground'],
  barText: c['tab.inactiveForeground'],
  dots: c['editorLineNumber.foreground'],
  modified: c['editorGutter.modifiedBackground'],
  added: c['editorGutter.addedBackground'],
  wordmark: c['editorCursor.foreground'],
  caption: c['editorLineNumber.foreground'],
};
for (const [k, v] of Object.entries(ui)) if (!/^#[0-9A-Fa-f]{6}$/.test(v ?? '')) throw new Error(`theme has no opaque colour for ${k}`);
const gutter = { 3: ui.modified, 4: ui.modified, 5: ui.modified, [CURRENT]: ui.added, 31: ui.modified };
const logo = easeStops(readFileSync(path.join(ROOT, 'assets/logo.svg'), 'utf8'));
const src = readFileSync(path.join(ROOT, 'samples', FILE), 'utf8').replace(/\t/g, '  ').split('\n');

const hl = await createHighlighter({ themes: [theme], langs: [LANG] });
const { tokens } = hl.codeToTokens(src.slice(FROM - 1, TO).join('\n'), { lang: LANG, theme: theme.name });
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const lines = tokens.map((line, i) => {
  const n = FROM + i, g = gutter[n] ? `style="background:${gutter[n]}"` : '';
  const html = line.map(t => `<span style="color:${t.color}">${esc(t.content)}</span>`).join('');
  return `<div class="line${n === CURRENT ? ' cur' : ''}"><span class="g" ${g}></span><span class="n">${n}</span><span class="c">${html}</span></div>`;
}).join('');

const hero = `<!doctype html><meta charset="utf-8"><title>Blue Hour</title><script>document.fonts.load('18.75px "${CODE_FONT}"');</script>
<style>
  html,body{margin:0;width:1800px;height:945px;overflow:hidden;background:${ui.ground}}
  .win{position:absolute;left:76px;top:76px;width:1900px;height:1000px;background:${ui.ground};border:1px solid ${ui.hairline};border-radius:14px;overflow:hidden;box-shadow:0 30px 80px rgba(0,0,0,.7)}
  .bar{height:52px;display:flex;align-items:center;padding:0 22px;border-bottom:1px solid ${ui.hairline};font:15px/1 -apple-system,"SF Pro Text",sans-serif;color:${ui.barText}}
  .dots{display:flex;gap:9px;margin-right:auto}.dots i{width:13px;height:13px;border-radius:50%;display:block;background:${ui.dots}}
  .title{position:absolute;left:0;right:0;text-align:center}
  .code{position:relative;padding-top:22px;font:18.75px/28.125px "${CODE_FONT}",monospace;font-feature-settings:"liga" 1,"calt" 1;color:${ui.text};white-space:pre}
  .line{display:flex;height:28.125px}.line.cur{background:${ui.raised}}
  .g{width:4px}.n{width:88px;padding-right:32px;text-align:right;color:${ui.lineNumber};flex:none}.cur .n{color:${ui.activeLineNumber}}.c{flex:none}
  .fade-r{position:absolute;inset:0;background:linear-gradient(90deg,transparent 55%,${ui.ground} 67%)}
  .fade-b{position:absolute;inset:0;background:linear-gradient(180deg,transparent 80%,${ui.ground} 100%)}
  .mark{position:absolute;right:76px;bottom:60px}
  .lock{display:flex;align-items:center;gap:12px;justify-content:flex-end;font:500 32px/1 -apple-system,"SF Pro Display","Helvetica Neue",sans-serif;color:${ui.wordmark};letter-spacing:.01em}
  .lock svg{width:64px;height:64px}
  .mark small{display:block;margin-top:8px;font:400 15px/1 "${CODE_FONT}",monospace;color:${ui.caption};text-align:right;letter-spacing:.04em}
</style>
<div class="win"><div class="bar"><span class="dots"><i></i><i></i><i></i></span><span class="title">${FILE}</span></div><div class="code">${lines}</div></div>
<div class="fade-r"></div><div class="fade-b"></div>
<div class="mark"><div class="lock">${logo}<span>Blue Hour</span></div><small>a dark theme for Cursor and VS Code</small></div>`;
const icon = `<!doctype html><meta charset="utf-8"><style>html,body{margin:0;width:256px;height:256px;overflow:hidden;background:transparent}svg{display:block;width:256px;height:256px}</style>${logo}`;
const probe = `<!doctype html><meta charset="utf-8"><body><span id="a" style="font:32px '${CODE_FONT}'">The hour after sunset</span><span id="b" style="font:32px 'No Such Font 7f3a'">The hour after sunset</span>
<script>const w = id => document.getElementById(id).getBoundingClientRect().width; document.body.textContent = w('a') !== w('b') ? 'FONT_' + 'PRESENT' : 'FONT_' + 'MISSING';</script>`;

// The logo's gradient is four rungs. Blended straight from stop to stop it shows a line at each middle stop, where the fade changes pace,
// so the render eases through the same stops (a monotone cubic in OKLab) and assets/logo.svg stays rung-only.
function easeStops(svg, steps = 32) {
  const stops = [...svg.matchAll(/<stop offset="([\d.]+)" stop-color="(#[0-9A-Fa-f]{6})"\/>/g)].map(m => [Number(m[1]), toLab(m[2])]);
  if (stops.length < 3 || stops.length !== (svg.match(/<stop\b/g) ?? []).length) throw new Error('logo.svg: every gradient stop must read <stop offset=".." stop-color="#RRGGBB"/>');
  const curve = [0, 1, 2].map(k => pchip(stops.map(s => s[0]), stops.map(s => s[1][k])));
  const eased = Array.from({ length: steps + 1 }, (_, i) => `<stop offset="${(i / steps).toFixed(4)}" stop-color="${toHex(curve.map(f => f(i / steps)))}"/>`);
  return svg.replace(/(<stop [^>]*\/>)+/, eased.join(''));
}
function pchip(xs, ys) {                         // monotone, so the curve never overshoots a rung
  const n = xs.length, h = xs.slice(1).map((x, i) => x - xs[i]), d = h.map((hi, i) => (ys[i + 1] - ys[i]) / hi);
  const m = [d[0], ...Array(n - 2).fill(0), d[n - 2]];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : 3 * (h[i - 1] + h[i]) / ((2 * h[i] + h[i - 1]) / d[i - 1] + (h[i] + 2 * h[i - 1]) / d[i]);
  return x => {
    let i = 0; while (i < n - 2 && x > xs[i + 1]) i++;
    const t = (x - xs[i]) / h[i];
    return (2 * t ** 3 - 3 * t ** 2 + 1) * ys[i] + (t ** 3 - 2 * t ** 2 + t) * h[i] * m[i] + (3 * t ** 2 - 2 * t ** 3) * ys[i + 1] + (t ** 3 - t ** 2) * h[i] * m[i + 1];
  };
}
function toLab(hex) {                            // sRGB hex to OKLab, Ottosson's matrices
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(v => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  const [l, m, s] = [0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b, 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b, 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b].map(Math.cbrt);
  return [0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s, 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s];
}
function toHex([L, a, b]) {
  const [l, m, s] = [L + 0.3963377774 * a + 0.2158037573 * b, L - 0.1055613458 * a - 0.0638541728 * b, L - 0.0894841775 * a - 1.2914855480 * b].map(v => v ** 3);
  const rgb = [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s];
  return '#' + rgb.map(v => Math.min(1, Math.max(0, v))).map(v => v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055)
    .map(v => Math.round(255 * v).toString(16).padStart(2, '0')).join('').toUpperCase();
}

const tmp = path.join(os.tmpdir(), 'blue-hour-hero'); mkdirSync(tmp, { recursive: true });
const chrome = (args) => execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--virtual-time-budget=5000', ...args], { stdio: ['ignore', 'pipe', 'pipe'] }).toString();
writeFileSync(path.join(tmp, 'probe.html'), probe);
if (!chrome(['--dump-dom', `file://${path.join(tmp, 'probe.html')}`]).includes('FONT_PRESENT')) throw new Error(`${CODE_FONT} is not installed; the hero would render in a fallback font`);
function shoot(name, html, w, h, scale, out) {
  writeFileSync(path.join(tmp, name), html);
  const target = path.join(ROOT, out);
  chrome(['--default-background-color=00000000', `--force-device-scale-factor=${scale}`, `--window-size=${w},${h}`, `--screenshot=${target}`, `file://${path.join(tmp, name)}`]);
  if (statSync(target).size < 1000) throw new Error(`${out} came out empty`);
  console.log(out, `${w * scale}x${h * scale}`);
}
shoot('hero.html', hero, 1800, 945, 2, 'assets/hero.png');
shoot('icon.html', icon, 256, 256, 1, 'assets/icon.png');
