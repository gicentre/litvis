import { positionKey } from "./keys";
import { DataWithPosition, Position } from "./types";

export default function (dataWithPosition: DataWithPosition): Position;
export default function (dataWithPosition: undefined): undefined;

export default function (
  dataWithPosition?: DataWithPosition,
): Position | undefined {
  if (typeof dataWithPosition === "undefined") {
    return undefined;
  }

  return dataWithPosition[positionKey];
}
