import { positionKey } from "./keys";
import type { DataWithPosition, Position } from "./types";

interface GetPosition {
  (dataWithPosition: DataWithPosition): Position;
  (dataWithPosition: undefined): undefined;
}

export const getPosition: GetPosition = (
  dataWithPosition: DataWithPosition | undefined,
) => {
  if (typeof dataWithPosition === "undefined") {
    return undefined;
  }

  return dataWithPosition[positionKey];
};
