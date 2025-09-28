import type { DataWithPosition } from "data-with-position";
import { getKind, getPosition } from "data-with-position";
import kindOf from "kind-of";

import { stringifyDataPath } from "./stringifyDataPath";
import type { NarrativeSchema } from "./types";

export const reportUnusedDataKeys = (
  narrativeSchema: NarrativeSchema,
  dataWithPosition: DataWithPosition,
  usedData: any,
  path: Array<string | number>,
  context?: string,
) => {
  const kindOfDataWithPosition = getKind(dataWithPosition);
  const kindOfUsedData = kindOf(usedData);
  if (kindOfDataWithPosition === "undefined") {
    return;
  }

  if (kindOfUsedData === "array") {
    for (let i = 0; i < usedData.length; i += 1) {
      reportUnusedDataKeys(narrativeSchema, dataWithPosition[i], usedData[i], [
        ...path,
        i,
      ]);
    }

    return;
  }

  if (kindOfUsedData === "object") {
    for (const key in dataWithPosition) {
      if (Object.prototype.hasOwnProperty.call(dataWithPosition, key)) {
        reportUnusedDataKeys(
          narrativeSchema,
          dataWithPosition[key],
          usedData[key],
          [...path, key],
        );
      }
    }

    return;
  }

  if (kindOfUsedData === "undefined") {
    narrativeSchema.info(
      `Finding ${stringifyDataPath(path)} ${
        context ? `in ${context} ` : ""
      }was unexpected and the value was ignored. Please check narrative schema docs and ensure there are no typos.`,
      getPosition(dataWithPosition),
    );
  }
};
