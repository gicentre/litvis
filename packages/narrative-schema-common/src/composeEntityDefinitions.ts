import {
  EntityDefinitionWithOrigin,
  NarrativeSchema,
  NarrativeSchemaData,
} from "./types";

export const composeEntityDefinitions = (
  narrativeSchema: NarrativeSchema,
  entityKey: keyof NarrativeSchemaData,
  alreadyLoadedEntitiesWithOrigin: EntityDefinitionWithOrigin[],
): EntityDefinitionWithOrigin[] => {
  return [
    ...alreadyLoadedEntitiesWithOrigin,
    ...narrativeSchema.data[entityKey].map((labelDefinition) => ({
      ...labelDefinition,
      origin: narrativeSchema,
    })),
  ];
};
