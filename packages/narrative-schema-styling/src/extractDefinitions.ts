import {
  DataWithPosition,
  getKind,
  getPosition,
  getValue,
} from "data-with-position";
import {
  EntityDefinition,
  NarrativeSchema,
  reportUnusedDataKeys,
} from "narrative-schema-common";

export const extractDefinitions = (
  dataWithPosition: DataWithPosition,
  narrativeSchema: NarrativeSchema,
): EntityDefinition[] => {
  const stylingDataWithPosition = dataWithPosition.styling;
  const kindOfStylingDataWithPosition = getKind(stylingDataWithPosition);
  if (
    kindOfStylingDataWithPosition === "null" ||
    kindOfStylingDataWithPosition === "undefined"
  ) {
    return [];
  }
  if (kindOfStylingDataWithPosition !== "object") {
    narrativeSchema.message(
      `Expected styling to be an object, got ${kindOfStylingDataWithPosition}`,
      getPosition(stylingDataWithPosition),
      "narrative-schema:styling",
    );

    return [];
  }

  const data: any = {};
  const kindOfCssLeaf = getKind(stylingDataWithPosition.css);
  if (
    kindOfCssLeaf === "null" ||
    kindOfCssLeaf === "undefined" ||
    kindOfCssLeaf === "string"
  ) {
    data.css = getValue(stylingDataWithPosition.css);
  } else {
    narrativeSchema.message(
      `Expected styling.css to be a string, got ${kindOfCssLeaf}`,
      getPosition(kindOfCssLeaf),
      "narrative-schema:styling",
    );
    data.css = "";
  }
  reportUnusedDataKeys(narrativeSchema, stylingDataWithPosition, data, [
    "styling",
  ]);
  if (data.css) {
    return [
      {
        dataWithPosition: stylingDataWithPosition,
        data,
        dataPath: ["styling", "css"],
      },
    ];
  }

  return [];
};
