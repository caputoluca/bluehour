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
const logo = readFileSync(path.join(ROOT, 'assets/logo.svg'), 'utf8');
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
