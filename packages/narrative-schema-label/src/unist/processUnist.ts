import { extractDerivatives } from "./extractDerivatives";
import { extractPlacement } from "./extractPlacement";
import { findLabels } from "./findLabels";
import { inspectBrokenPairs } from "./inspectBrokenPairs";
import { pairLabels } from "./pairLabels";

export const processUnist = [
  findLabels,
  extractDerivatives,
  extractPlacement,
  pairLabels,
  inspectBrokenPairs,
];
