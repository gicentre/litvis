import { FromYamlTestCaseConfig } from "../types";

export const config: FromYamlTestCaseConfig = {
  nodesToCheck: [
    {
      path: [],
      expectedObjectKeys: ["hello"],
      expectedPosition: {
        start: { line: 2, column: 1 },
        end: { line: 3, column: 1 },
      },
    },
    {
      path: ["hello"],
      expectedPosition: {
        start: { line: 2, column: 1 },
        end: { line: 2, column: 13 },
      },
    },
  ],
};
