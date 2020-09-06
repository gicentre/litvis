import { EntityDefinitionWithOrigin, NarrativeSchema } from "./types";

export const composeEntityDefinitions = (
  narrativeSchema: NarrativeSchema,
  entityKey: string,
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
