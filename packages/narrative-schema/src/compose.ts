import * as _ from "lodash";
import {
  composeDefinitions as composeLabels,
  LabelDefinitionWithOrigin,
} from "narrative-schema-label";
import {
  composeDefinitions as composeRules,
  RuleDefinitionWithOrigin,
} from "narrative-schema-rule";
import {
  composeDefinitions as composeStyling,
  StylingWithOrigin,
} from "narrative-schema-styling";
import { resolve } from "path";
import * as vfile from "vfile";

import { ComposedNarrativeSchema, NarrativeSchema } from "./types";

const compose = async <Document extends vfile.VFileBase<any>>(
  narrativeSchemas: Array<NarrativeSchema<Document>>,
): Promise<ComposedNarrativeSchema<Document>> => {
  const labels: LabelDefinitionWithOrigin[] = [];
  const rules: RuleDefinitionWithOrigin[] = [];
  const styling: StylingWithOrigin[] = [];

  for (const narrativeSchema of narrativeSchemas) {
    labels.push(...composeLabels(labels, narrativeSchema));
    rules.push(...composeRules(rules, narrativeSchema));
    styling.push(...composeStyling(rules, narrativeSchema));
  }
  return {
    components: narrativeSchemas,
    labels,
    rules,
    styling,
  };
};

export default load;

const resolveNarrativeSchemaPath = async (
  path,
  file: Document | NarrativeSchema,
): Promise<string> => {
  let result = resolve(file.dirname, path);
  if (
    !_.endsWith(result.toLowerCase(), ".yml") &&
    !_.endsWith(result.toLowerCase(), ".yaml")
  ) {
    result += ".yml";
  }
  return result;
};

const traceParents = (parents: Array<Document | NarrativeSchema>): string => {
  if (parents && parents.length) {
    const parts = _.reduce(
      parents,
      (arr, parent) => {
        arr.push(" < ");
        arr.push(formatPath(parent.path));
        return arr;
      },
      [],
    );
    return ` (${parts.join("")})`;
  }
  return "";
};

const getArrayOfParents = (
  narrativeSchema: NarrativeSchema,
): Array<Document | NarrativeSchema> => {
  const result = [];
  let currentFile: Document | NarrativeSchema = narrativeSchema;
  while (currentFile) {
    currentFile = (currentFile as any).dependencyOf;
    if (currentFile) {
      result.push(currentFile);
    }
  }

  return result;
};

const formatPath = (path) => path;

const readListOfItems = (
  entityName,
  idField,
  items,
  composedItems,
  file: NarrativeSchema,
  validationResult,
) => {
  if (_.isArray(items)) {
    for (let i = 0; i < items.length; i += 1) {
      const item = items[i];
      // do not add an item that has validation issues
      const validationError = _.find(
        validationResult.errors,
        (error) => error.instance === item,
      );
      if (validationError) {
        file.info(
          `${entityName} ${
            item[idField] ? `‘${item[idField]}’` : `${i}`
          } is is not used because it does not pass validation`,
          null,
          `litvis:narrative-schema-${entityName}`,
        );
        continue;
      }

      // do not add item if it's already added earlier
      const previouslyDeclaredItem = _.find(
        composedItems,
        (currentItem) => currentItem[idField] === item[idField],
      );
      if (previouslyDeclaredItem) {
        const where =
          previouslyDeclaredItem.origin === file
            ? "above"
            : `in ${formatPath(
                previouslyDeclaredItem.origin.path,
              )}${traceParents(
                getArrayOfParents(previouslyDeclaredItem.origin),
              )}`;
        file.info(
          `${entityName} ‘${
            item[idField]
          }’ is skipped because it is already declared ${where}`,
          null,
          `litvis:narrative-schema-${entityName}`,
        );
        continue;
      }

      composedItems.push({
        origin: file,
        ...item,
      });
    }
  }
};
