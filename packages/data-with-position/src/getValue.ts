import { DataWithPosition } from "./types";

const getValue = (dataWithPosition: DataWithPosition): any => {
  if (!dataWithPosition) {
    return undefined;
  }
  if (Array.isArray(dataWithPosition)) {
    return dataWithPosition.map((el) => getValue(el));
  }

  const value = dataWithPosition.valueOf();
  if (value instanceof Object) {
    const result = {};
    for (const key in dataWithPosition) {
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
