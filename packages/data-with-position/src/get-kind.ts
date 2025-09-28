import { kindKey } from "./keys";
import type { DataKind, DataWithPosition } from "./types";

export const getKind = (dataWithPosition?: DataWithPosition): DataKind => {
  if (!dataWithPosition) {
    return "undefined";
  }

  return dataWithPosition[kindKey];
};
