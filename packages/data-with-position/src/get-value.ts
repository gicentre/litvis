import type { DataWithPosition } from "./types";

export const getValue = (dataWithPosition: DataWithPosition): any => {
  if (typeof dataWithPosition === "undefined") {
    return undefined;
  }

  if (Array.isArray(dataWithPosition)) {
    return dataWithPosition.map((el) => getValue(el));
  }

  const value = dataWithPosition.valueOf();
  if (value instanceof Object) {
    const result: Record<string, unknown> = {};
    for (const [key, dataWithPositionValue] of Object.entries(
      dataWithPosition,
    )) {
      // istanbul ignore next
      if (Object.prototype.hasOwnProperty.call(dataWithPosition, key)) {
        result[key] = getValue(dataWithPositionValue);
      }
    }

    return result;
  } else {
    return value;
  }
};
