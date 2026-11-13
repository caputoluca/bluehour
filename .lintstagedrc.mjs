// What the pre-commit hook (.husky/pre-commit) runs on the staged files, before the drift check.
const quoted = (files) => files.map((file) => JSON.stringify(file)).join(" ");

export default {
	// Biome's own recipe glob, plus the hero's pages; Biome's includes keep it to tools/
	"*.{js,ts,cjs,mjs,d.cts,d.mts,jsx,tsx,json,jsonc,html}": "biome check --write --no-errors-on-unmatched",
	// tools/ only: ruff skips its exclude list for a file named on the command line, and the samples are not code we run.
	// The type checkers take no file names, so a change to colortool.py is checked against check.py, which imports it.
	"tools/**/*.py": (files) => [
		`uv run ruff format ${quoted(files)}`,
		`uv run ruff check --ignore-noqa ${quoted(files)}`,
		"uv run ty check",
		"uv run basedpyright",
	],
};
