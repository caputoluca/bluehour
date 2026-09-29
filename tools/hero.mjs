#!/usr/bin/env node
// Renders assets/hero.png (the README card, 2x) and assets/icon.png (the Marketplace icon) from the theme file itself:
// samples/blue-hour.ts coloured by Shiki with the theme's own tokenColors, composed like Vesper's card on the theme's ground,
// the logo from assets/logo.svg in the lockup. Nothing here is a screenshot, so a colour change regenerates the hero.
// usage: node tools/hero.mjs [file] [lang] [from] [to] [current]   defaults: blue-hour.ts ts 1 33 23
import { createHighlighter } from 'shiki';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHROME = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const [file = 'blue-hour.ts', lang = 'ts', fromS = '1', toS = '33', curS = '23'] = process.argv.slice(2);
const from = +fromS, to = +toS, current = +curS;

const theme = JSON.parse(readFileSync(path.join(ROOT, 'themes/blue-hour-color-theme.json'), 'utf8'));
const pal = JSON.parse(readFileSync(path.join(ROOT, 'palette.json'), 'utf8'));
const logo = readFileSync(path.join(ROOT, 'assets/logo.svg'), 'utf8');
const src = readFileSync(path.join(ROOT, 'samples', file), 'utf8').replace(/\t/g, '  ').split('\n');

const hl = await createHighlighter({ themes: [theme], langs: [lang] });
const { tokens } = hl.codeToTokens(src.slice(from - 1, to).join('\n'), { lang, theme: theme.name });
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const gutter = { [from + 2]: pal.blue, [from + 3]: pal.blue, [from + 4]: pal.blue, [current]: pal.green, [to - 2]: pal.blue };
const lines = tokens.map((line, i) => {
  const n = from + i, g = gutter[n] ? `style="background:${gutter[n]}"` : '';
  const html = line.map(t => `<span style="color:${t.color}">${esc(t.content)}</span>`).join('');
  return `<div class="line${n === current ? ' cur' : ''}"><span class="g" ${g}></span><span class="n">${n}</span><span class="c">${html}</span></div>`;
}).join('');

const hero = `<!doctype html><meta charset="utf-8"><title>Blue Hour</title>
<style>
  html,body{margin:0;width:1800px;height:945px;overflow:hidden;background:${pal.ground}}
  .win{position:absolute;left:76px;top:76px;width:1900px;height:1000px;background:${pal.ground};border:1px solid ${pal.hairline};border-radius:14px;overflow:hidden;box-shadow:0 30px 80px rgba(0,0,0,.7)}
  .bar{height:52px;display:flex;align-items:center;padding:0 22px;border-bottom:1px solid ${pal.hairline};font:15px/1 -apple-system,"SF Pro Text",sans-serif;color:${pal.subtle}}
  .dots{display:flex;gap:9px;margin-right:auto}.dots i{width:13px;height:13px;border-radius:50%;display:block;background:${pal.muted}}
  .title{position:absolute;left:0;right:0;text-align:center}
  .code{position:relative;padding-top:22px;font:18.75px/28.125px "Geist Mono",Menlo,monospace;font-feature-settings:"liga" 1,"calt" 1;color:${pal.frame};white-space:pre}
  .line{display:flex;height:28.125px}.line.cur{background:${pal.raised}}
  .g{width:4px}.n{width:88px;padding-right:32px;text-align:right;color:${pal.muted};flex:none}.cur .n{color:${pal.subtle}}.c{flex:none}
  .fade-r{position:absolute;inset:0;background:linear-gradient(90deg,transparent 55%,${pal.ground} 67%)}
  .fade-b{position:absolute;inset:0;background:linear-gradient(180deg,transparent 80%,${pal.ground} 100%)}
  .mark{position:absolute;right:76px;bottom:60px}
  .lock{display:flex;align-items:center;gap:12px;justify-content:flex-end;font:500 32px/1 -apple-system,"SF Pro Display","Helvetica Neue",sans-serif;color:${pal.bright};letter-spacing:.01em}
  .lock svg{width:64px;height:64px}
  .mark small{display:block;margin-top:8px;font:400 15px/1 "Geist Mono",Menlo,monospace;color:${pal.muted};text-align:right;letter-spacing:.04em}
</style>
<div class="win"><div class="bar"><span class="dots"><i></i><i></i><i></i></span><span class="title">${file}</span></div><div class="code">${lines}</div></div>
<div class="fade-r"></div><div class="fade-b"></div>
<div class="mark"><div class="lock">${logo}<span>Blue Hour</span></div><small>a dark theme for Cursor and VS Code</small></div>`;
const icon = `<!doctype html><meta charset="utf-8"><style>html,body{margin:0;width:256px;height:256px;overflow:hidden;background:transparent}svg{display:block;width:256px;height:256px}</style>${logo}`;

const tmp = path.join(os.tmpdir(), 'blue-hour-hero'); mkdirSync(tmp, { recursive: true });
function shoot(name, html, w, h, scale, out) {
  writeFileSync(path.join(tmp, name), html);
  execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--default-background-color=00000000',
    `--force-device-scale-factor=${scale}`, `--window-size=${w},${h}`, `--screenshot=${path.join(ROOT, out)}`, `file://${path.join(tmp, name)}`], { stdio: 'ignore' });
  console.log(out, `${w * scale}x${h * scale}`);
}
shoot('hero.html', hero, 1800, 945, 2, 'assets/hero.png');
shoot('icon.html', icon, 256, 256, 1, 'assets/icon.png');
