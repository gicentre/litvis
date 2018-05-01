import { DataWithPosition, getKind, getPosition } from "data-with-position";
import * as kindOf from "kind-of";
import stringifyDataPath from "./stringifyDataPath";
import { NarrativeSchema } from "./types";

// @ts-ignore
import { VFileBase } from "vfile";
// @ts-ignore
import { NarrativeSchemaData } from "./types";

const reportUnusedDataKeys = (
  narrativeSchema: NarrativeSchema,
  dataWithPosition: DataWithPosition,
  usedData: any,
  path: Array<string | number>,
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
      if (dataWithPosition.hasOwnProperty(key)) {
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
      `Finding ${stringifyDataPath(
        path,
      )} was unexpected and the value was ignored. Please check narrative schema docs and ensure there are no typos.`,
      getPosition(dataWithPosition),
    );
  }
};

export default reportUnusedDataKeys;
