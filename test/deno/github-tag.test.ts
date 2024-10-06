import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, expect, expectTypeOf, it } from "vitest";
import RE2 from "re2";

const repositoryRoot = dirname(dirname(__dirname));

const file = readFileSync(
	join(repositoryRoot, "deno", "github-tag.json"),
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

describe("github tag for import_map", () => {
	const testCases = [
		{
			currentValue: "1.0.0",
			depName: "user/repo",
			input: `{
        "imports": {
          "sample": "https://raw.githubusercontent.com/user/repo/1.0.0/mod.ts",
        }
      }`,
			title: "should accept raw.githubusercontent.com",
		},
		{
			currentValue: "1.0.0",
			depName: "user/repo",
			input: `{
        "imports": {
          "sample": "https://pax.deno.dev/user/repo@1.0.0/mod.ts",
        }
      }`,
			title: "should accept pax.deno.dev",
		},
		{
			currentValue: "1.0.0",
			depName: "user/repo",
			input: `{
        "imports": {
          "sample": "https://pax.deno.dev/user/repo@1.0.0",
        }
      }`,
			title: "should accept omit 'mod.ts' when specify pax.deno.dev",
		},
		{
			currentValue: "1.0.0-alpha-a.b-c-somethinglong+build.1-aef.1-its-okay",
			depName: "user/repo",
			input: `{
        "imports": {
          "sample": "https://raw.githubusercontent.com/user/repo/1.0.0-alpha-a.b-c-somethinglong+build.1-aef.1-its-okay/mod.ts"
        }
      }`,
			title: "should accept complex semver version",
		},
		{
			currentValue: "sampleversion",
			depName: "user/repo",
			input: `{
        "imports": {
          "sample": "https://raw.githubusercontent.com/user/repo/sampleversion/mod.ts"
        }
      }`,
			title: "should accept un-semver version",
		},
	];

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

describe("github tag for js file", () => {
	const testCases = [
		{
			currentValue: "1.0.0",
			depName: "user/repo",
			input: `import { sample } from "https://raw.githubusercontent.com/user/repo/1.0.0/mod.ts"`,
			title: "should accept raw.githubusercontent.com",
		},
		{
			currentValue: "1.0.0",
			depName: "user/repo",
			input: `import { sample } from "https://pax.deno.dev/user/repo@1.0.0/mod.ts"`,
			title: "should accept pax.deno.dev",
		},
		{
			currentValue: "1.0.0",
			depName: "user/repo",
			input: `import { sample } from "https://pax.deno.dev/user/repo@1.0.0"`,
			title: "should accept omit 'mod.ts' when specify pax.deno.dev",
		},
		{
			currentValue: "1.0.0-alpha-a.b-c-somethinglong+build.1-aef.1-its-okay",
			depName: "user/repo",
			input: `import { sample } from "https://raw.githubusercontent.com/user/repo/1.0.0-alpha-a.b-c-somethinglong+build.1-aef.1-its-okay/mod.ts"`,
			title: "should accept complex semver version",
		},
		{
			currentValue: "sampleversion",
			depName: "user/repo",
			input: `import { sample } from "https://raw.githubusercontent.com/user/repo/sampleversion/mod.ts"`,
			title: "should accept un-semver version",
		},
		{
			currentValue: "1.0.0",
			depName: "user/repo",
			input: `// @deno-types="https://raw.githubusercontent.com/user/repo/1.0.0/mod.ts"`,
			title: "should accept raw.githubusercontent.com in //@deno-types",
		},
		{
			currentValue: "1.0.0",
			depName: "user/repo",
			input: `// @deno-types="https://pax.deno.dev/user/repo@1.0.0/mod.ts"`,
			title: "should accept pax.deno.dev in //@deno-types",
		},
		{
			currentValue: "1.0.0",
			depName: "user/repo",
			input: `// @deno-types="https://pax.deno.dev/user/repo@1.0.0"`,
			title:
        "should accept omit 'mod.ts' when specify pax.deno.dev in //@deno-types",
		},
		{
			currentValue: "1.0.0-alpha-a.b-c-somethinglong+build.1-aef.1-its-okay",
			depName: "user/repo",
			input: `// @deno-types="https://raw.githubusercontent.com/user/repo/1.0.0-alpha-a.b-c-somethinglong+build.1-aef.1-its-okay/mod.ts"`,
			title: "should accept complex semver version in //@deno-types",
		},
		{
			currentValue: "sampleversion",
			depName: "user/repo",
			input: `// @deno-types="https://raw.githubusercontent.com/user/repo/sampleversion/mod.ts"`,
			title: "should accept un-semver version in //@deno-types",
		},
	];

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
