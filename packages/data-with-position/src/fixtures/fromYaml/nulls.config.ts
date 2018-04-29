import { FromYamlTestCaseConfig } from "../types";

const config: FromYamlTestCaseConfig = {
  nodesToCheck: [
    {
      path: [],
      expectedObjectKeys: ["obj", "arr"],
      expectedPosition: {
        start: { line: 1, column: 1 },
        end: { line: 12, column: 1 },
      },
    },
    {
      path: ["obj"],
      expectedObjectKeys: [
        "givenNull",
        "givenNothing",
        "givenFalse",
        "givenTrue",
      ],
      expectedPosition: {
        start: { line: 1, column: 1 },
        end: { line: 5, column: 18 },
      },
    },
    {
      path: ["obj", "givenNull"],
      expectedPosition: {
        start: { line: 2, column: 3 },
        end: { line: 2, column: 18 },
      },
      expectedValue: null,
    },
    {
      path: ["obj", "givenNothing"],
      expectedPosition: {
        start: { line: 3, column: 3 },
        end: { line: 3, column: 16 },
      },
      expectedValue: null,
    },
    {
      path: ["obj", "givenFalse"],
      expectedPosition: {
        start: { line: 4, column: 3 },
        end: { line: 4, column: 20 },
      },
      expectedValue: false,
    },
    {
      path: ["obj", "givenTrue"],
      expectedPosition: {
        start: { line: 5, column: 3 },
        end: { line: 5, column: 18 },
      },
      expectedValue: true,
    },
    {
      path: ["arr", 0],
      expectedValue: "str",
    },
    // {
    //   path: ["arr", 1],
    //   expectedValue: null,
    // },
    {
      path: ["arr", 1],
      expectedValue: 1,
    },
    {
      path: ["arr", 2],
      expectedValue: null,
    },
    {
      path: ["arr", 3],
      expectedValue: false,
    },
  ],
};

export default config;
