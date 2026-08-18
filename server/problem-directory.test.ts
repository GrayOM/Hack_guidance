import { describe, expect, it } from "vitest";
import { filterProblemDirectory, problems } from "../client/src/lib/curriculum";

describe("problem directory", () => {
  it("contains exactly 50 unique nodes for the public problem menu", () => {
    expect(problems).toHaveLength(50);
    expect(new Set(problems.map(problem => problem.id)).size).toBe(50);
    expect(problems.map(problem => problem.id)).toEqual(Array.from({ length: 50 }, (_, index) => index + 1));
  });

  it("returns the correct single set of nodes for all, sector, and search filters", () => {
    expect(filterProblemDirectory()).toHaveLength(50);
    expect(filterProblemDirectory({ sector: 1 })).toHaveLength(10);
    expect(filterProblemDirectory({ sector: 5 })).toHaveLength(10);
    expect(filterProblemDirectory({ query: "쿠키" }).map(problem => problem.id)).toEqual([3]);
  });
});
