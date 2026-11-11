import { describe, expect, it } from "vitest";

import {
  fitSplitToTotal,
  formatSplit,
  parseSizeRange,
  starterSplit,
  sumSplit,
} from "@/lib/sizes";

const mTo2xl = ["M", "L", "XL", "2XL"];

describe("parseSizeRange", () => {
  it("expands a range in standard size order", () => {
    expect(parseSizeRange("M - 2XL")).toEqual(mTo2xl);
    expect(parseSizeRange("S-XL")).toEqual(["S", "M", "L", "XL"]);
    expect(parseSizeRange("m - 2xl")).toEqual(mTo2xl);
  });

  it("returns no sizes for empty or unknown ranges", () => {
    expect(parseSizeRange("")).toEqual([]);
    expect(parseSizeRange(undefined)).toEqual([]);
    expect(parseSizeRange("Free size")).toEqual([]);
    expect(parseSizeRange("2XL - M")).toEqual([]);
  });
});

describe("starterSplit", () => {
  it("fills six pieces from the middle sizes out", () => {
    expect(starterSplit(mTo2xl)).toEqual({ M: 1, L: 2, XL: 2, "2XL": 1 });
    expect(starterSplit(["S", "M", "L", "XL", "2XL"])).toEqual({ S: 1, M: 1, L: 2, XL: 1, "2XL": 1 });
    expect(starterSplit(["M", "L"])).toEqual({ M: 3, L: 3 });
    expect(starterSplit(["L"])).toEqual({ L: 6 });
  });

  it("always totals six", () => {
    for (const sizes of [mTo2xl, ["S", "M", "L", "XL", "2XL"], ["M", "L"], ["L"]]) {
      expect(sumSplit(starterSplit(sizes))).toBe(6);
    }
  });

  it("leaves the last size in the middle-out order empty when there are more than six sizes", () => {
    expect(starterSplit(["XS", "S", "M", "L", "XL", "2XL", "3XL"])).toEqual({
      XS: 0,
      S: 1,
      M: 1,
      L: 1,
      XL: 1,
      "2XL": 1,
      "3XL": 1,
    });
  });
});

describe("fitSplitToTotal", () => {
  it("grows from the middle sizes first", () => {
    const grown = fitSplitToTotal({ M: 1, L: 2, XL: 2, "2XL": 1 }, mTo2xl, 8);
    expect(sumSplit(grown)).toBe(8);
    expect(grown).toEqual({ M: 1, L: 3, XL: 3, "2XL": 1 });
  });

  it("shrinks from the outer sizes without going negative", () => {
    const shrunk = fitSplitToTotal({ M: 1, L: 3, XL: 3, "2XL": 2 }, mTo2xl, 6);
    expect(sumSplit(shrunk)).toBe(6);
    expect(Object.values(shrunk).every((value) => value >= 0)).toBe(true);
    expect(shrunk.L).toBe(3);
  });
});

describe("formatSplit", () => {
  it("lists non-zero sizes in order", () => {
    expect(formatSplit({ M: 0, L: 3, XL: 3 }, ["M", "L", "XL"])).toBe("L 3 · XL 3");
    expect(formatSplit({ M: 1, L: 2, XL: 2, "2XL": 1 }, mTo2xl)).toBe("M 1 · L 2 · XL 2 · 2XL 1");
  });
});
