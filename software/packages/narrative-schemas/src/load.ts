import * as _ from "lodash";
import { resolve } from "path";
import { read as readVFile } from "to-vfile";
import * as vfile from "vfile";
import * as yaml from "yamljs";
import { Document } from "./types";

import {
  ComposedNarrativeSchema,
  CssWithOrigin,
  LabelDefinitionWithOrigin,
  NarrativeSchema,
  // @ts-ignore
  NarrativeSchemaData,
  RuleDefinitionWithOrigin,
} from "./types";
import validateSchema from "./validateSchema";

const load = async (
  dependentSchemaPaths,
  parents: Array<Document | NarrativeSchema>,
  schemasAlreadyLoaded: NarrativeSchema[],
  filesInMemory: Array<vfile.VFileBase<{}>>,
): Promise<ComposedNarrativeSchema> => {
  const labels: LabelDefinitionWithOrigin[] = [];
  const rules: RuleDefinitionWithOrigin[] = [];
  const css: CssWithOrigin[] = [];
  const components: NarrativeSchema[] = [];
  if (dependentSchemaPaths) {
    for (const path of dependentSchemaPaths) {
      const resolvedPath = await resolveNarrativeSchemaPath(path, parents[0]);
      let file: NarrativeSchema;

      // silently skip narrative schema loading if already done so
      // this is not an issue; schema dependency graph does not have to ve acyclic
      if (
        _.find(schemasAlreadyLoaded, (schema) => schema.path === resolvedPath)
      ) {
        continue;
      }

      // load narrative schema file
      try {
        const fileInMemory = _.find(
          filesInMemory,
          (f: Document) => f.path === resolvedPath,
        );
        file = fileInMemory
          ? vfile(fileInMemory)
          : await readVFile(resolvedPath, "utf8");
        components.push(file);
      } catch (e) {
        parents[0].message(
          `Unable to load narrative schema dependency ${path}${traceParents(
            parents,
          )}. Does this file ${resolvedPath} exist?`,
          null,
          "litvis:narrative-schema-load",
        );
      }

      // parse yaml
      let rawData;
      try {
        rawData = yaml.parse(file.contents.toString());
      } catch (e) {
        try {
          file.fail(
            `Unable to parse schema ${path}${traceParents(parents)}`,
            null,
            "litvis:narrative-schema-parse",
          );
        } catch (e) {
          // noop, just preventing Error throwing
        }
        continue;
      }

      // match file with schema
      const validationResult = validateSchema(rawData);
      if (validationResult.errors.length) {
        for (const error of validationResult.errors) {
          file.message(
            `‘${error.property}’ ${error.message}`,
            null,
            "litvis:narrative-schema-validation",
          );
        }
      }

      if (!_.isPlainObject(rawData)) {
        continue;
      }

      // load dependencies
      if (_.isArray(rawData.dependencies)) {
        const subComposedNarrativeSchema = await load(
          rawData.dependencies,
          [file, ...parents],
          [...components, ...schemasAlreadyLoaded],
          filesInMemory,
        );
        components.push(...subComposedNarrativeSchema.components);
        labels.push(...subComposedNarrativeSchema.labels);
        rules.push(...subComposedNarrativeSchema.rules);
        css.push(...subComposedNarrativeSchema.css);
      }

      // read labels
      readListOfItems(
        "label",
        "name",
        rawData.labels,
        labels,
        file,
        validationResult,
      );

      // read rules
      readListOfItems(
        "rule",
        "description",
        rawData.rules,
        rules,
        file,
        validationResult,
      );

      // read css
      const cssContent = _.get(rawData, ["styling", "css"]);
      if (_.isString(cssContent)) {
        file.data.css = cssContent;
        css.push({
          content: cssContent,
          origin: file,
        });
      }
    }
  }
  return {
    components,
    labels,
    rules,
    css,
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
