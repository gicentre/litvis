import { getPosition } from "data-with-position";
import { EntityDefinitionWithOrigin } from "narrative-schema-common";

export default (
  labelDefinitions: EntityDefinitionWithOrigin[],
): { [name: string]: EntityDefinitionWithOrigin } => {
  const result: { [name: string]: EntityDefinitionWithOrigin } = {};

  let remainingDefinitions = labelDefinitions;
  while (true) {
    const newRemainingDefinitions: EntityDefinitionWithOrigin[] = [];

    remainingDefinitions.forEach((labelDefinition) => {
      const alreadyExistingLabelDefinition = result[labelDefinition.data.name];
      if (alreadyExistingLabelDefinition) {
        const definedWhere =
          alreadyExistingLabelDefinition.origin === labelDefinition.origin
            ? "above"
            : `in narrative schema ${alreadyExistingLabelDefinition.origin.path}`;

        labelDefinition.origin.message(
          `Label ${labelDefinition.data.name} is ignored because it has already been defined ${definedWhere}`,
          getPosition(labelDefinition.dataWithPosition),
          "narrative-schema:label",
        );
        return;
      }

      if (labelDefinition.data.aliasFor) {
        const resolvedLabelDefinition = result[labelDefinition.data.aliasFor];
        if (resolvedLabelDefinition) {
          result[labelDefinition.data.name] = resolvedLabelDefinition;
        } else {
          newRemainingDefinitions.push(labelDefinition);
        }
      } else {
        result[labelDefinition.data.name] = labelDefinition;
      }
    });

    if (remainingDefinitions.length === newRemainingDefinitions.length) {
      break;
    }
    remainingDefinitions = newRemainingDefinitions;
  }

  remainingDefinitions.forEach((labelDefinition) => {
    labelDefinition.origin.message(
      `Label alias ${labelDefinition.data.name} could not be resolved to an actual label. Please check the integrity of narrative schemas that you are using.`,
      getPosition(labelDefinition.dataWithPosition),
      "narrative-schema:label",
    );
  });
  return result;
};
