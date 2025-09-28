import { extractDerivatives } from "./extract-derivatives";
import { extractPlacement } from "./extract-placement";
import { findLabels } from "./find-labels";
import { inspectBrokenPairs } from "./inspect-broken-pairs";
import { pairLabels } from "./pair-labels";

export const processUnist = [
  findLabels,
  extractDerivatives,
  extractPlacement,
  pairLabels,
  inspectBrokenPairs,
];
