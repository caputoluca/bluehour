// Renders assets/hero.png (the README card, at 2x) and assets/icon.png (the registry icon) from the theme file, with no
// screenshot of an editor: Shiki colors samples/blue-hour.ts with the theme's token rules, tools/hero/ holds the card's pages
// with the theme's own colors, the logo comes from assets/logo.svg, and headless Chrome takes the picture. `npm run hero`.
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHighlighter } from "shiki";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CHROME = process.env.CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const CODE_FONT = "Geist Mono"; // Luca's editor font; the render refuses to run without it

// The stretch of the sample on the card: the evening, lines 1–33, the cursor on ceiling.off().
const SAMPLE = { file: "blue-hour.ts", lang: "ts", from: 1, to: 33, current: 23 };
// The gutter's change marks, by line number: a picture of a file being edited, not read from git.
const MODIFIED_LINES = [3, 4, 5, 31];
const ADDED_LINES = [SAMPLE.current];

const theme = readJson("themes/blue-hour-color-theme.json");
const colors = chromeColors(theme.colors);
const logo = easeStops(read("assets/logo.svg"));

const hero = page("hero", {
	font: CODE_FONT,
	colors: Object.entries(colors)
		.map(([role, hex]) => `--${role}: ${hex};`)
		.join(" "),
	file: SAMPLE.file,
	lines: await codeLines(colors),
	logo,
});
const icon = page("icon", { logo });

const scratch = path.join(tmpdir(), "blue-hour-hero");
mkdirSync(scratch, { recursive: true });
requireFont(CODE_FONT);
shoot({ name: "hero", html: hero, width: 1800, height: 945, scale: 2, out: "assets/hero.png" });
shoot({ name: "icon", html: icon, width: 256, height: 256, scale: 1, out: "assets/icon.png" });

// ---- the card's content

/** Every chrome color is the theme's own key for that role, so the card follows the theme. Keys become CSS variables. */
function chromeColors(themeColors) {
	const roles = {
		ground: "editor.background",
		raised: "editor.lineHighlightBackground",
		hairline: "editorGroup.border",
		"line-number": "editorLineNumber.foreground",
		"active-line-number": "editorLineNumber.activeForeground",
		text: "editor.foreground",
		"bar-text": "tab.inactiveForeground",
		dots: "editorLineNumber.foreground",
		modified: "editorGutter.modifiedBackground",
		added: "editorGutter.addedBackground",
		wordmark: "editorCursor.foreground",
		caption: "editorLineNumber.foreground",
	};
	const out = {};
	for (const [role, key] of Object.entries(roles)) {
		const hex = themeColors[key];
		if (!/^#[0-9A-Fa-f]{6}$/.test(hex ?? "")) {
			throw new Error(`theme has no opaque color at ${key} (the card's ${role})`);
		}
		out[role] = hex;
	}
	return out;
}

/** The sample's lines as HTML, each token in the color the theme's token rules give it. */
async function codeLines({ modified, added }) {
	const gutter = new Map([...MODIFIED_LINES.map((n) => [n, modified]), ...ADDED_LINES.map((n) => [n, added])]);
	const source = read(`samples/${SAMPLE.file}`).replaceAll("\t", "  ").split("\n");
	const highlighter = await createHighlighter({ themes: [theme], langs: [SAMPLE.lang] });
	const { tokens } = highlighter.codeToTokens(source.slice(SAMPLE.from - 1, SAMPLE.to).join("\n"), {
		lang: SAMPLE.lang,
		theme: theme.name,
	});
	return tokens
		.map((line, i) => {
			const n = SAMPLE.from + i;
			const mark = gutter.has(n) ? `style="background:${gutter.get(n)}"` : "";
			const code = line
				.map((token) => `<span style="color:${token.color}">${escapeHtml(token.content)}</span>`)
				.join("");
			const current = n === SAMPLE.current ? " cur" : "";
			return `<div class="line${current}"><span class="g" ${mark}></span><span class="n">${n}</span><span class="c">${code}</span></div>`;
		})
		.join("");
}

/** One of the pages in tools/hero/, each {{slot}} filled; a slot with no value, or a value with no slot, is an error. */
function page(name, values) {
	const template = read(`tools/hero/${name}.html`);
	const slots = new Set([...template.matchAll(/\{\{(\w+)\}\}/g)].map((match) => match[1]));
	const missing = [...slots].filter((slot) => !(slot in values));
	const unused = Object.keys(values).filter((key) => !slots.has(key));
	if (missing.length > 0 || unused.length > 0) {
		throw new Error(`tools/hero/${name}.html: slots with no value: [${missing}]; values with no slot: [${unused}]`);
	}
	return template.replace(/\{\{(\w+)\}\}/g, (_, slot) => values[slot]);
}

function escapeHtml(text) {
	return text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

// ---- the logo's gradient

// The logo's gradient is four rungs. Blended straight from stop to stop it shows a line at each middle stop, where the fade
// changes pace, so the render eases through the same stops (a monotone cubic in OKLab) and assets/logo.svg stays rung-only.
function easeStops(svg, steps = 32) {
	const stops = [...svg.matchAll(/<stop offset="([\d.]+)" stop-color="(#[0-9A-Fa-f]{6})"\/>/g)].map((match) => ({
		offset: Number(match[1]),
		lab: hexToOklab(match[2]),
	}));
	if (stops.length < 3 || stops.length !== (svg.match(/<stop\b/g) ?? []).length) {
		throw new Error('logo.svg: every gradient stop must read <stop offset=".." stop-color="#RRGGBB"/>');
	}
	const offsets = stops.map((stop) => stop.offset);
	const curves = [0, 1, 2].map((axis) =>
		pchip(
			offsets,
			stops.map((stop) => stop.lab[axis]),
		),
	);
	const eased = Array.from({ length: steps + 1 }, (_, i) => {
		const x = i / steps;
		return `<stop offset="${x.toFixed(4)}" stop-color="${oklabToHex(curves.map((curve) => curve(x)))}"/>`;
	});
	return svg.replace(/(<stop [^>]*\/>)+/, eased.join(""));
}

/** A monotone cubic through the points (PCHIP), so the curve never overshoots a rung. */
function pchip(xs, ys) {
	const n = xs.length;
	const widths = xs.slice(1).map((x, i) => x - xs[i]);
	const slopes = widths.map((width, i) => (ys[i + 1] - ys[i]) / width);
	const tangents = [slopes[0], ...Array(n - 2).fill(0), slopes[n - 2]];
	for (let i = 1; i < n - 1; i++) {
		const [h0, h1, d0, d1] = [widths[i - 1], widths[i], slopes[i - 1], slopes[i]];
		tangents[i] = d0 * d1 <= 0 ? 0 : (3 * (h0 + h1)) / ((2 * h1 + h0) / d0 + (h1 + 2 * h0) / d1);
	}
	return (x) => {
		let i = 0;
		while (i < n - 2 && x > xs[i + 1]) i++;
		const h = widths[i];
		const t = (x - xs[i]) / h;
		return (
			(2 * t ** 3 - 3 * t ** 2 + 1) * ys[i] +
			(t ** 3 - 2 * t ** 2 + t) * h * tangents[i] +
			(3 * t ** 2 - 2 * t ** 3) * ys[i + 1] +
			(t ** 3 - t ** 2) * h * tangents[i + 1]
		);
	};
}

// sRGB hex <-> OKLab, Ottosson's matrices (the same as tools/colortool.py)
function hexToOklab(hex) {
	const [r, g, b] = [1, 3, 5].map((i) => srgbToLinear(Number.parseInt(hex.slice(i, i + 2), 16) / 255));
	const [l, m, s] = [
		0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b,
		0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b,
		0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b,
	].map(Math.cbrt);
	return [
		0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
		1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
		0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
	];
}

function oklabToHex([lightness, a, b]) {
	const [l, m, s] = [
		lightness + 0.3963377774 * a + 0.2158037573 * b,
		lightness - 0.1055613458 * a - 0.0638541728 * b,
		lightness - 0.0894841775 * a - 1.291485548 * b,
	].map((v) => v ** 3);
	const rgb = [
		4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
		-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
		-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
	];
	const byte = (v) => Math.round(255 * linearToSrgb(Math.min(1, Math.max(0, v))));
	return `#${rgb.map((v) => byte(v).toString(16).padStart(2, "0")).join("")}`.toUpperCase();
}

function srgbToLinear(v) {
	return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

function linearToSrgb(v) {
	return v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055;
}

// ---- headless Chrome

function chrome(args) {
	return execFileSync(
		CHROME,
		["--headless=new", "--disable-gpu", "--hide-scrollbars", "--virtual-time-budget=5000", ...args],
		{
			stdio: ["ignore", "pipe", "pipe"],
		},
	).toString();
}

/** Throws unless the font is installed; tools/hero/font-probe.html says how it tells. */
function requireFont(font) {
	const file = path.join(scratch, "font-probe.html");
	writeFileSync(file, page("font-probe", { font }));
	if (!chrome(["--dump-dom", `file://${file}`]).includes("FONT_PRESENT")) {
		throw new Error(`${font} is not installed; the hero would render in a fallback font`);
	}
}

function shoot({ name, html, width, height, scale, out }) {
	const file = path.join(scratch, `${name}.html`);
	const target = path.join(ROOT, out);
	writeFileSync(file, html);
	chrome([
		"--default-background-color=00000000",
		`--force-device-scale-factor=${scale}`,
		`--window-size=${width},${height}`,
		`--screenshot=${target}`,
		`file://${file}`,
	]);
	if (statSync(target).size < 1000) throw new Error(`${out} came out empty`);
	console.log(out, `${width * scale}x${height * scale}`);
}

// ---- files

function read(relative) {
	return readFileSync(path.join(ROOT, relative), "utf8");
}

function readJson(relative) {
	return JSON.parse(read(relative));
}
