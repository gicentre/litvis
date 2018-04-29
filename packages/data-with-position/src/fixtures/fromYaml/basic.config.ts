import { FromYamlTestCaseConfig } from "../types";

const config: FromYamlTestCaseConfig = {
  nodesToCheck: [
    {
      path: [],
      expectedObjectKeys: ["obj"],
      expectedPosition: {
        start: { line: 1, column: 1 },
        end: { line: 13, column: 1 },
      },
    },
    {
      path: ["obj"],
      expectedObjectKeys: ["arr", "num", "str"],
      expectedPosition: {
        start: { line: 1, column: 1 },
        end: { line: 12, column: 11 },
      },
      expectedValue: {
        arr: [
          {
            nums: [1, 2, 3],
            strs: ["1", "2", "3"],
          },
        ],
        num: 1,
        str: "1",
      },
    },
    {
      path: ["obj", "num"],
      expectedPosition: {
        start: { line: 11, column: 3 },
        end: { line: 11, column: 9 },
      },
      expectedValue: 1,
    },
    {
      path: ["obj", "str"],
      expectedPosition: {
        start: { line: 12, column: 3 },
        end: { line: 12, column: 11 },
      },
      expectedValue: "1",
    },
    {
      path: ["obj", "arr", 0],
      expectedObjectKeys: ["nums", "strs"],
      expectedPosition: {
        start: { line: 3, column: 5 },
        end: { line: 11, column: 3 },
      },
    },
    {
      path: ["obj", "arr", 0, "nums"],
      expectedPosition: {
        start: { line: 3, column: 5 },
        end: { line: 7, column: 5 },
      },
      expectedValue: [1, 2, 3],
    },
    {
      path: ["obj", "arr", 0, "strs"],
      expectedPosition: {
        start: { line: 7, column: 5 },
        end: { line: 11, column: 3 },
      },
      expectedValue: ["1", "2", "3"],
    },
  ],
};

export default config;
