// @ts-ignore
import { VFileBase } from "vfile";
// @ts-ignore
import { NarrativeSchemaData } from "./types";

import { DataWithPosition, getKind, getPosition } from "data-with-position";
import reportUnusedDataKeys from "./reportUnusedDataKeys";
import stringifyDataPath from "./stringifyDataPath";
import { EntityDefinition, NarrativeSchema } from "./types";

export default (
  narrativeSchema: NarrativeSchema,
  dataWithPosition: DataWithPosition,
  dataKeyForEntityArray: string,
  entityName,
  extractData: (
    narrativeSchema,
    entityDataWithPosition: DataWithPosition,
    entityDataPath: Array<string | number>,
  ) => any | null,
  shapeOfExpectedData,
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
    const entityDataPath = [entityName, i];
    const entityDataWithPosition = listOfEntitiesWithPosition[i];
    const kindOfEntityData = getKind(entityDataWithPosition);
    if (kindOfEntityData !== "object") {
      narrativeSchema.message(
        `Expected ${stringifyDataPath(
          entityDataPath,
        )} to be an object, got ${kindOfEntityData}`,
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
      entityDataPath,
    );
    if (!entityData) {
      narrativeSchema.info(
        `Skipping ${stringifyDataPath(
          entityDataPath,
        )} due to declaration issues`,
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
