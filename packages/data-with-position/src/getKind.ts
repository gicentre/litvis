import { kindKey } from "./keys";
import { DataWithPosition, Kind } from "./types";

export default (dataWithPosition?: DataWithPosition): Kind => {
  if (!dataWithPosition) {
    return "undefined";
  }
  return dataWithPosition[kindKey];
};
