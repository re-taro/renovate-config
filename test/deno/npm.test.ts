import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, expect, expectTypeOf, it } from "vitest";
import RE2 from "re2";

const repositoryRoot = dirname(dirname(__dirname));

const file = readFileSync(join(repositoryRoot, "deno", "npm.json")).toString();
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

describe("npm for import map", () => {
	const testCases = [
		{
			currentValue: "5.0.1",
			depName: "chalk",
			input: `{
        "imports": {
          "chalk": "npm:chalk@5.0.1",
        }
      }`,
			title: "should accept npm specifier",
		},
		{
			currentValue: "5.0.1",
			depName: "chalk",
			input: `{
        "imports": {
          "chalk": "https://esm.sh/chalk@5.0.1",
        }
      }`,
			title: "should accept esm.sh specifier",
		},
		{
			currentValue: "2.6.2",
			depName: "tslib",
			input: `{
        "imports": {
          "tslib": "https://esm.sh/tslib@2.6.2?exports=__await,__rest",
        }
      }`,
			title: "should accept esm.sh specifier with query",
		},
		{
			currentValue: "5",
			depName: "chalk",
			input: `{
        "imports": {
          "chalk": "npm:chalk@5",
        }
      }`,
			title: "should accept only major version",
		},
		{
			currentValue: "0.1.0",
			depName: "@bar/foo",
			input: `{
        "imports": {
          "foo": "https://unpkg.com/@bar/foo@0.1.0/foo.ts",
        }
      }`,
			title: "should accept unpkg.com specifier",
		},
		{
			currentValue: "0.1.0",
			depName: "foo",
			input: `{
        "imports": {
          "foo": "https://unpkg.com/foo@0.1.0/umd/foo.production.min.js",
        }
      }`,
			title: "should accept unpkg.com specifier without @scope",
		},
		{
			currentValue: "10.5.5",
			depName: "@scope/package",
			input: `{
        "imports": {
          "foo": "https://cdn.skypack.dev/@scope/package@10.5.5",
        }
      }`,
			title: "should accept skypack.dev specifier",
		},
		{
			currentValue: "10.5.5",
			depName: "@scope/package",
			input: `{
        "imports": {
          "foo": "https://cdn.skypack.dev/@scope/package@10.5.5?min",
        }
      }`,
			title: "should accept skypack.dev with query",
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

// NOTE: This feature is not required in the imports field in deno.json and source files.
// https://github.com/denoland/deno/pull/22087
// https://deno.com/blog/v1.40#simpler-imports-in-denojson
describe("should accept npm specifier with subpath exports in import map", () => {
	it("should match all exports of preact", () => {
		const testCase = {
			currentValue: "10.5.13",
			depName: "preact",
			input: `{
        "imports": {
          "preact": "npm:preact@10.5.13",
          "preact/": "npm:/preact@10.5.13/"
        }
      }`,
		} as const;

		const re = regexps[0].map(r => new RegExp(r, "gm"));
		const matches = re
			.map(r => Array.from(testCase.input.matchAll(r)).map(e => e.groups))
			.filter(match => match.length !== 0)
			.flat();
		expect(matches.length).toBe(2);
		for (const match of matches) {
			expect(match?.currentValue).toBe(testCase.currentValue);
			expect(match?.depName).toBe(testCase.depName);
		}
	});
});

describe("npm for js file", () => {
	const testCases = [
		{
			currentValue: "5.0.1",
			depName: "chalk",
			input: `import chalk from "npm:chalk@5.0.1";`,
			title: "should accept npm specifier",
		},
		{
			currentValue: "5.0.1",
			depName: "chalk",
			input: `export chalk from "https://esm.sh/chalk@5.0.1";`,
			title: "should accept esm.sh specifier",
		},
		{
			currentValue: "5.0.1",
			depName: "chalk",
			input: `export chalk from "https://esm.sh/v135/chalk@5.0.1";`,
			title: "should accept esm.sh specifier with prefix",
		},
		{
			currentValue: "2.6.2",
			depName: "tslib",
			input: `import { __await, __rest } from "https://esm.sh/tslib@2.6.2?exports=__await,__rest";`,
			title: "should accept esm.sh specifier with query",
		},
		{
			currentValue: "5",
			depName: "chalk",
			input: `import chalk from "npm:chalk@5";`,
			title: "should accept only major version",
		},
		{
			currentValue: "0.1.0",
			depName: "@bar/foo",
			input: `import foo from "https://unpkg.com/@bar/foo@0.1.0/foo.ts";`,
			title: "should accept unpkg.com specifier",
		},
		{
			currentValue: "0.1.0",
			depName: "foo",
			input: `import foo from "https://unpkg.com/foo@0.1.0/umd/foo.production.min.js";`,
			title: "should accept unpkg.com specifier without @scope",
		},
		{
			currentValue: "10.5.5",
			depName: "@scope/package",
			input: `import foo from "https://cdn.skypack.dev/@scope/package@10.5.5";`,
			title: "should accept skypack.dev specifier",
		},
		{
			currentValue: "10.5.5",
			depName: "@scope/package",
			input: `import foo from "https://cdn.skypack.dev/@scope/package@10.5.5?min";`,
			title: "should accept skypack.dev with query",
		},
		{
			currentValue: "5.0.1",
			depName: "chalk",
			input: `// @deno-types="npm:chalk@5.0.1";`,
			title: "should accept npm specifier in //@deno-types",
		},
		{
			currentValue: "2.6.2",
			depName: "tslib",
			input: `// @deno-types="https://esm.sh/tslib@2.6.2?exports=__await,__rest";`,
			title: "should accept esm.sh specifier with query in //@deno-types",
		},
		{
			currentValue: "5",
			depName: "chalk",
			input: `// @deno-types="npm:chalk@5";`,
			title: "should accept only major version in //@deno-types",
		},
		{
			currentValue: "0.1.0",
			depName: "@bar/foo",
			input: `// @deno-types="https://unpkg.com/@bar/foo@0.1.0/foo.ts";`,
			title: "should accept unpkg.com specifier in //@deno-types",
		},
		{
			currentValue: "0.1.0",
			depName: "foo",
			input: `// @deno-types="https://unpkg.com/foo@0.1.0/umd/foo.production.min.js";`,
			title:
        "should accept unpkg.com specifier without @scope in //@deno-types",
		},
		{
			currentValue: "10.5.5",
			depName: "@scope/package",
			input: `// @deno-types="https://cdn.skypack.dev/@scope/package@10.5.5";`,
			title: "should accept skypack.dev specifier in //@deno-types",
		},
		{
			currentValue: "10.5.5",
			depName: "@scope/package",
			input: `// @deno-types="https://cdn.skypack.dev/@scope/package@10.5.5?min";`,
			title: "should accept skypack.dev with query in //@deno-types",
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
