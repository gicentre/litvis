import { kindKey } from "./keys";
import { DataKind, DataWithPosition } from "./types";

export default (dataWithPosition?: DataWithPosition): DataKind => {
  if (!dataWithPosition) {
    return "undefined";
  }
  return dataWithPosition[kindKey];
};
