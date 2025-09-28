import type { FromYamlTestCaseConfig } from "../types";

export const config: FromYamlTestCaseConfig = {
  nodesToCheck: [
    {
      path: [],
      expectedObjectKeys: ["obj"],
      expectedPosition: {
        start: { line: 2, column: 5 },
        end: { line: 14, column: 3 },
      },
    },
    {
      path: ["obj"],
      expectedObjectKeys: ["arr", "str", "num"],
      expectedPosition: {
        start: { line: 2, column: 5 },
        end: { line: 13, column: 13 },
      },
    },
    {
      path: ["obj", "str"],
      expectedPosition: {
        start: { line: 12, column: 7 },
        end: { line: 12, column: 15 },
      },
    },
    {
      path: ["obj", "num"],
      expectedPosition: {
        start: { line: 13, column: 7 },
        end: { line: 13, column: 13 },
      },
    },
    {
      path: ["obj", "arr", 0],
      expectedObjectKeys: ["nums", "strs1"],
      expectedPosition: {
        start: { line: 4, column: 9 },
        end: { line: 12, column: 7 },
      },
    },
    {
      path: ["obj", "arr", 0, "nums"],
      expectedPosition: {
        start: { line: 4, column: 9 },
        end: { line: 8, column: 9 },
      },
    },
    {
      path: ["obj", "arr", 0, "strs1"],
      expectedPosition: {
        start: { line: 8, column: 9 },
        end: { line: 12, column: 7 },
      },
    },
  ],
};
