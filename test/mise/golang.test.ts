import { describe, expect, expectTypeOf, it } from "vitest";
import RE2 from "re2";
import config from "../../mise/golang.json";

const regexps: RE2[][] = config.customManagers.map(c =>
	c.matchStrings.map(re => new RE2(re)),
);

describe("check configuration existing", () => {
	it("should be array", () => {
		expect(Array.isArray(config));
	});
	it("should be array of RE2", () => {
		expectTypeOf(regexps).toEqualTypeOf<RE2[][]>();
	});
});

describe("golang", () => {
	const testCases = [
		{
			currentValue: "1.21.6",
			input: "go = \"1.21.6\"  # renovate: mise",
			it: "should parse quote with \"",
		},
		{
			currentValue: "1.21.6",
			input: "golang = \"1.21.6\"  # renovate: mise",
			it: "should accept \"golang\" too",
		},
		{
			currentValue: "1.21.6",
			input: "go = \"v1.21.6\"  # renovate: mise",
			it: "should perse even if it includes 'v' too",
		},
		{
			currentValue: "1.22.0",
			input: "go = '1.22.0'  # renovate: mise",
			it: "should perse even if it is quoted with single quote too",
		},
	] as const;

	for (const testCase of testCases) {
		it(testCase.it, () => {
			const re = regexps[0].map(r => new RE2(r, "gm"));
			const matches = re
				.map(r => Array.from(testCase.input.matchAll(r)).map(e => e.groups))
				.filter(match => match.length !== 0)
				.flat();
			expect(matches.length).toBe(1);
			expect(matches[0]?.currentValue).toBe(testCase.currentValue);
		});
	}
});
