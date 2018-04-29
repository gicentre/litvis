import { DataWithPosition } from "./types";

const getValue = (dataWithPosition: DataWithPosition): any => {
  if (typeof dataWithPosition === "undefined") {
    return undefined;
  }

  if (Array.isArray(dataWithPosition)) {
    return dataWithPosition.map((el) => getValue(el));
  }

  const value = dataWithPosition.valueOf();
  if (value instanceof Object) {
    const result = {};
    for (const key in dataWithPosition) {
      // istanbul ignore next
      if (dataWithPosition.hasOwnProperty(key)) {
        result[key] = getValue(dataWithPosition[key]);
      }
    }
    return result;
  } else {
    return value;
  }
};

export default getValue;
