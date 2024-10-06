import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, expect, expectTypeOf, it } from "vitest";
import RE2 from "re2";

const repositoryRoot = dirname(dirname(__dirname));

const file = readFileSync(
	join(repositoryRoot, "deno", "deno-land.json"),
).toString();
const config: string[][] = JSON.parse(file)?.customManagers?.map(
	(manager: { matchStrings?: string[] }) => manager.matchStrings,
);

const regexps: RE2[][] = config.map((matchStrings: string[]) =>
	matchStrings.map(re => new RE2(re)),
);

describe("check configuration existing", () => {
	it("should be array", () => {
		expect(Array.isArray(config));
	});
	it("should be array of regexp", () => {
		expectTypeOf(regexps).toEqualTypeOf<RE2[][]>();
	});
});

describe("deno.land for import map", () => {
	const testCases = [
		{
			currentValue: "0.204.0",
			depName: "https://deno.land/std",
			input: `{
        "import_map": {
          "std": "https://deno.land/std@0.204.0",
        }
      }`,
			title: "should be accept deno.land/std",
		},
		{
			currentValue: "v0.204.0",
			depName: "https://deno.land/std",
			input: `{
        "import_map": {
          "path": "https://deno.land/std@v0.204.0/path/mod.ts",
        }
      }`,
			title: "should be accept if include 'v' in version",
		},
		{
			currentValue: "v0.1.0",
			depName: "https://deno.land/x/some_module",
			input: `{
        "import_map": {
          "some": "https://deno.land/x/some_module@v0.1.0",
        }
      }`,
			title: "should be accept deno.land/x",
		},
	] as const;

	it.each(testCases)("$title", ({ currentValue, depName, input }) => {
		const re = regexps[0].map(r => new RegExp(r, "gm"));
		const matches = re
			.map(r => Array.from(input.matchAll(r)).map(e => e.groups))
			.filter(match => match.length !== 0)
			.flat();
		expect(matches.length).toBe(1);
		expect(matches[0]?.currentValue).toBe(currentValue);
		expect(matches[0]?.depName).toBe(depName);
	});
});

describe("deno.land for js file", () => {
	const testCases = [
		{
			currentValue: "0.204.0",
			depName: "https://deno.land/std",
			input: `import { join } from "https://deno.land/std@0.204.0/path/mod.ts";`,
			title: "should accept deno.land/std",
		},
		{
			currentValue: "0.204.0",
			depName: "https://deno.land/std",
			input: `export { someFuncion } from "https://deno.land/std@0.204.0/some/mod.ts";`,
			title: "should accept export specifier",
		},
		{
			currentValue: "v1.0.0",
			depName: "https://deno.land/std",
			input: `import { someFuncion } from "https://deno.land/std@v1.0.0/some/mod.ts";`,
			title: "should accept if 'v' in version",
		},
		{
			currentValue: "0.1.0",
			depName: "https://deno.land/x/some_module",
			input: `export { someFuncion } from "https://deno.land/x/some_module@0.1.0/some/mod.ts";`,
			title: "should accept deno.land/x",
		},
		{
			currentValue: "0.204.0",
			depName: "https://deno.land/std",
			input: `// @deno-types="https://deno.land/std@0.204.0/path/mod.ts";`,
			title: "should accept deno.land/std in //@deno-types",
		},
		{
			currentValue: "v1.0.0",
			depName: "https://deno.land/std",
			input: `// @deno-types="https://deno.land/std@v1.0.0/some/mod.ts";`,
			title: "should accept if 'v' in version in //@deno-types",
		},
		{
			currentValue: "0.1.0",
			depName: "https://deno.land/x/some_module",
			input: `// @deno-types="https://deno.land/x/some_module@0.1.0/some/mod.ts";`,
			title: "should accept deno.land/x in //@deno-types",
		},
	] as const;

	it.each(testCases)("$title", ({ currentValue, depName, input }) => {
		const re = regexps[1].map(r => new RegExp(r, "gm"));
		const matches = re
			.map(r => Array.from(input.matchAll(r)).map(e => e.groups))
			.filter(match => match.length !== 0)
			.flat();
		expect(matches.length).toBe(1);
		expect(matches[0]?.currentValue).toBe(currentValue);
		expect(matches[0]?.depName).toBe(depName);
	});
});
