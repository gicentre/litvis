import {
  DataWithPosition,
  getKind,
  getPosition,
  getValue,
} from "data-with-position";
import _ from "lodash";
import {
  EntityDefinition,
  extractArrayOfEntities,
  NarrativeSchema,
  stringifyDataPath,
} from "narrative-schema-common";
import { isValidLabelName } from "narrative-schema-label";

const selectorShape = {
  label: true,
  kind: true,
  trimmedContent: true,
};

const extractSelectorData = (
  narrativeSchema: NarrativeSchema,
  selectorWithPosition: DataWithPosition,
  containerWithPosition: DataWithPosition,
  dataPath: Array<number | string>,
  selectorIsOptional = false,
): null | any => {
  const dataToReturn: any = {};
  let selectorIsBroken = false;

  const kindOfSelector = getKind(selectorWithPosition);
  if (kindOfSelector === "undefined" || kindOfSelector === "null") {
    if (!selectorIsOptional) {
      narrativeSchema.message(
        `Expected rule ${stringifyDataPath(
          dataPath,
        )} to be an object, got ${kindOfSelector}`,
        getPosition(selectorWithPosition || containerWithPosition),
        "narrative-schema:rule",
      );
      selectorIsBroken = true;
    }
  } else if (kindOfSelector !== "object") {
    narrativeSchema.message(
      `Expected rule selector to be an object, got ${kindOfSelector}`,
      getPosition(selectorWithPosition),
      "narrative-schema:rule",
    );
    selectorIsBroken = true;
  } else {
    // selector.label
    const kindOfLabel = getKind(selectorWithPosition.label);
    const label = getValue(selectorWithPosition.label);
    if (kindOfLabel !== "string") {
      narrativeSchema.message(
        `Expected rule selector.label to be a string, got ${kindOfLabel}`,
        getPosition(selectorWithPosition.label || selectorWithPosition),
        "narrative-schema:rule",
      );
      selectorIsBroken = true;
    } else if (!isValidLabelName(label)) {
      narrativeSchema.message(
        `Expected label name to have a form of an identifier (i.e. to consist of latin characters, numbers or _)`,
        getPosition(selectorWithPosition.label),
        "narrative-schema:rule",
      );
      selectorIsBroken = true;
    } else {
      dataToReturn.label = label;
    }

    // selector.kind
    const kindOfKind = getKind(selectorWithPosition.kind);
    const kind = getValue(selectorWithPosition.kind);
    if (kindOfKind === "null" || kindOfKind === "undefined") {
      // do nothing, because selector.kind is optional
    } else if (kind !== "single" && kind !== "paired") {
      narrativeSchema.message(
        `Expected rule selector.kind to be "single" or "paired", got ${
          kindOfKind === "string" ? kind : kindOfKind
        }`,
        getPosition(selectorWithPosition.kind || selectorWithPosition),
        "narrative-schema:rule",
      );
      selectorIsBroken = true;
    } else {
      dataToReturn.label = label;
    }

    // selector trimmedContent
    const kindOfTrimmedContent = getKind(selectorWithPosition.trimmedContent);
    if (
      kindOfTrimmedContent === "null" ||
      kindOfTrimmedContent === "undefined"
    ) {
      //
    } else if (kindOfTrimmedContent !== "string") {
      narrativeSchema.message(
        `Expected rule ${stringifyDataPath([
          ...dataPath,
          "trimmedContent",
        ])} to be a string, got ${kindOfTrimmedContent}`,
        getPosition(selectorWithPosition.trimmedContent),
        "narrative-schema:rule",
      );
      selectorIsBroken = true;
    } else {
      dataToReturn.trimmedContent = getValue(
        selectorWithPosition.trimmedContent,
      );
    }
  }
  if (selectorIsBroken) {
    throw new Error("data is broken");
  }
  return dataToReturn;
};

const extractDataFromRule = (
  narrativeSchema,
  ruleDataWithPosition,
  ruleDataPath: Array<number | string>,
) => {
  const ruleData: any = {};
  let ruleIsBroken = false;

  // ensure description
  const descriptionWithPosition = ruleDataWithPosition.description;
  const kindOfDescription = getKind(descriptionWithPosition);
  if (kindOfDescription !== "string") {
    ruleIsBroken = true;
    narrativeSchema.message(
      `Expected rule description to be a string, got ${kindOfDescription}`,
      getPosition(descriptionWithPosition || ruleDataWithPosition),
      "narrative-schema:rule",
    );
  } else {
    const description = getValue(descriptionWithPosition);
    if (_.trim(description) === "") {
      narrativeSchema.message(
        `Expected rule description to be non-empty`,
        getPosition(descriptionWithPosition),
        "narrative-schema:rule",
      );
      ruleIsBroken = true;
    } else {
      ruleData.description = description;
    }
  }

  // extract selector
  const selectorWithPosition = ruleDataWithPosition.selector;
  const kindOfSelector = getKind(selectorWithPosition);
  try {
    ruleData.selector = extractSelectorData(
      narrativeSchema,
      selectorWithPosition,
      ruleDataWithPosition,
      ["selector"],
    );
  } catch (e) {
    ruleIsBroken = true;
  }

  // occurrences
  ["minimumOccurrences", "maximumOccurrences"].forEach((occurrencesName) => {
    const kind = getKind(ruleDataWithPosition[occurrencesName]);
    if (kind === "null" || kind === "undefined") {
      return;
    }
    const value = getValue(ruleDataWithPosition[occurrencesName]);
    if (kind !== "number" || !Number.isInteger(value) || value < 0) {
      narrativeSchema.message(
        `Expected ${occurrencesName} to be a non-negative integer, got ${
          Number.isFinite(value) ? value : kind
        }`,
        getPosition(ruleDataWithPosition[occurrencesName]),
        "narrative-schema:rule",
      );
      ruleIsBroken = true;
    } else {
      ruleData[occurrencesName] = value;
    }
  });
  if (
    Number.isInteger(ruleData.minimumOccurrences) &&
    Number.isInteger(ruleData.maximumOccurrences) &&
    ruleData.maximumOccurrences < ruleData.minimumOccurrences
  ) {
    narrativeSchema.message(
      `The value for maximumOccurrences cannot be less than minimumOccurrences`,
      getPosition(ruleDataWithPosition.maximumOccurrences),
      "narrative-schema:rule",
    );
    ruleIsBroken = true;
  }

  // children
  const kindOfChildren = getKind(ruleDataWithPosition.children);
  if (kindOfChildren === "null" || kindOfChildren === "undefined") {
    //
  } else if (kindOfSelector !== "object") {
    narrativeSchema.message(
      `Expected rule children to be an object, got ${kindOfChildren}`,
      getPosition(ruleDataWithPosition.children),
      "narrative-schema:rule",
    );
    ruleIsBroken = true;
  } else {
    // minimumTrimmedTextLength
    const kind = getKind(
      ruleDataWithPosition.children.minimumTrimmedTextLength,
    );
    const value = getValue(
      ruleDataWithPosition.children.minimumTrimmedTextLength,
    );
    if (kind === "null" || kind === "undefined") {
      //
    } else if (kind !== "number" || !Number.isInteger(value) || value < 0) {
      narrativeSchema.message(
        `Expected children.minimumTrimmedTextLength to be a non-negative integer, got ${
          Number.isFinite(value) ? value : kind
        }`,
        getPosition(
          ruleDataWithPosition[
            ruleDataWithPosition.children.minimumTrimmedTextLength
          ],
        ),
        "narrative-schema:rule",
      );
      ruleIsBroken = true;
    } else {
      ruleData.children = {
        minimumTrimmedTextLength: value,
      };
    }
  }

  // followedBy / notFollowedBy
  ["followedBy", "notFollowedBy", "before", "after"].forEach((property) => {
    const kind = getKind(ruleDataWithPosition[property]);
    if (kind === "null" || kind === "undefined") {
      //
    } else if (kind !== "object") {
      narrativeSchema.message(
        `Expected rule ${property} to be an object, got ${kind}`,
        getPosition(ruleDataWithPosition[property]),
        "narrative-schema:rule",
      );
      ruleIsBroken = true;
    } else {
      try {
        ruleData[property] = {
          selector: extractSelectorData(
            narrativeSchema,
            ruleDataWithPosition[property].selector,
            ruleDataWithPosition[property],
            [property, "selector"],
          ),
        };
      } catch (e) {
        ruleIsBroken = true;
      }
      // if (property === "followedBy") {
      //   try {
      //     ruleData.selector = extractSelectorData(
      //       narrativeSchema,
      //       ruleDataWithPosition[property].notAfter,
      //       ruleDataWithPosition[property],
      //       [property, "notAfter"],
      //       true,
      //     );
      //   } catch (e) {
      //     ruleIsBroken = true;
      //   }
      // }
    }
  });

  // + selector,
  if (!ruleIsBroken && Object.keys(ruleData).length < 3) {
    narrativeSchema.message(
      `Rule ${
        (_.last(ruleDataPath) as number) * 1 + 1
      } does not defile any valid constrains`,
      getPosition(ruleDataWithPosition),
      "narrative-schema:rule",
    );
    return null;
  }

  if (ruleIsBroken) {
    return null;
  }
  return ruleData;
};

export const extractDefinitions = (
  dataWithPosition: DataWithPosition,
  narrativeSchema: NarrativeSchema,
): EntityDefinition[] =>
  extractArrayOfEntities(
    narrativeSchema,
    dataWithPosition,
    "rules",
    "rule",
    extractDataFromRule,
    {
      description: true,
      selector: selectorShape,
      minimumOccurrences: true,
      maximumOccurrences: true,
      children: {
        minimumTrimmedTextLength: true,
      },

      // immediate following
      followedBy: {
        selector: selectorShape,
        // notAfter: selectorShape,
      },
      notFollowedBy: {
        selector: selectorShape,
      },

      // following anywhere in the narrative
      before: {
        selector: selectorShape,
      },
      after: {
        selector: selectorShape,
      },
    },
  );
