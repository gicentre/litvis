import type { DataWithPosition } from "data-with-position";
import { getKind, getPosition } from "data-with-position";

import { reportUnusedDataKeys } from "./reportUnusedDataKeys";
import type { EntityDefinition, NarrativeSchema } from "./types";

export const extractArrayOfEntities = (
  narrativeSchema: NarrativeSchema,
  dataWithPosition: DataWithPosition,
  dataKeyForEntityArray: string,
  entityName: "label" | "rule" | "styling",
  extractData: (
    narrativeSchema: NarrativeSchema,
    entityDataWithPosition: DataWithPosition,
    entityDataPath: Array<string | number>,
  ) => any | null,
  shapeOfExpectedData: Record<string, unknown>,
): EntityDefinition[] => {
  const listOfEntitiesWithPosition = dataWithPosition[dataKeyForEntityArray];
  const kindOfListOfEntities = getKind(listOfEntitiesWithPosition);
  if (kindOfListOfEntities === "null" || kindOfListOfEntities === "undefined") {
    return [];
  }

  if (kindOfListOfEntities !== "array") {
    narrativeSchema.message(
      `Expected ${dataKeyForEntityArray} to be an array, got ${kindOfListOfEntities}`,
      getPosition(listOfEntitiesWithPosition),
      `narrative-schema:${entityName}`,
    );

    return [];
  }

  const result: EntityDefinition[] = [];
  for (let i = 0; i < listOfEntitiesWithPosition.length; i += 1) {
    const entityDataPath = [dataKeyForEntityArray, i];
    const entityDataWithPosition = listOfEntitiesWithPosition[i];
    const kindOfEntityData = getKind(entityDataWithPosition);
    if (kindOfEntityData !== "object") {
      narrativeSchema.message(
        `Expected ${entityName} to be an object, got ${kindOfEntityData}`,
        getPosition(entityDataWithPosition),
        `narrative-schema:${entityName}`,
      );
      continue;
    }

    const entityData = extractData(
      narrativeSchema,
      entityDataWithPosition,
      entityDataPath,
    );
    reportUnusedDataKeys(
      narrativeSchema,
      entityDataWithPosition,
      shapeOfExpectedData,
      [],
      entityName,
    );
    if (!entityData) {
      narrativeSchema.info(
        `Skipping ${entityName} ${i + 1} due to declaration issues`,
        getPosition(entityDataWithPosition),
        `narrative-schema:${entityName}`,
      );
    } else {
      result.push({
        data: entityData,
        dataWithPosition: entityDataWithPosition,
        dataPath: entityDataPath,
      });
    }
  }

  return result;
};
