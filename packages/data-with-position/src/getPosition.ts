import positionKey from "./positionKey";
import { DataWithPosition } from "./types";

export default (dataWithPosition: DataWithPosition): any => {
  if (!dataWithPosition) {
    return null;
  }
  return dataWithPosition[positionKey];
};
