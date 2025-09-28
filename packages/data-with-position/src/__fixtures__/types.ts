import type { Position } from "../types";

export interface FromYamlTestCaseConfig {
  nodesToCheck: Array<{
    path: Array<number | string>;
    expectedObjectKeys?: string[];
    expectedKind?: string;
    expectedArrayLength?: number;
    expectedPosition?: Position;
    expectedValue?: any;
  }>;
}
