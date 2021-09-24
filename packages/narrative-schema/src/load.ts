import {
  DataWithPosition,
  fromYaml,
  getKind,
  getPosition,
  getValue,
} from "data-with-position";
import _ from "lodash";
import {
  NarrativeSchema,
  ParentDocument,
  reportUnusedDataKeys,
} from "narrative-schema-common";
import { extractDefinitions as extractLabelDefinitions } from "narrative-schema-label";
import { extractDefinitions as extractRuleDefinitions } from "narrative-schema-rule";
import { extractDefinitions as extractStylingDefinitions } from "narrative-schema-styling";
import { resolve } from "path";
import { read as readVFile } from "to-vfile";
import vfile, { VFile } from "vfile";

import { traceParents } from "./traceParents";

const resolveNarrativeSchemaPath = async (
  path: string,
  file: VFile,
): Promise<string> => {
  let result = resolve(file.dirname || "", path);
  if (
    !_.endsWith(result.toLowerCase(), ".yml") &&
    !_.endsWith(result.toLowerCase(), ".yaml")
  ) {
    result += ".yml";
  }

  return result;
};

export const load = async (
  dependenciesWithPosition: DataWithPosition,
  parents: Array<ParentDocument | NarrativeSchema>,
  filesInMemory: VFile[],
  schemasAlreadyLoaded: NarrativeSchema[],
): Promise<NarrativeSchema[]> => {
  const kind = getKind(dependenciesWithPosition);
  if (kind === "null" || kind === "undefined") {
    return [];
  }
  if (kind !== "array") {
    if (parents[0]) {
      parents[0].message(
        `Expected the list of dependent schema narratives to be array, ${kind} given${traceParents(
          parents,
        )}`,
        getPosition(dependenciesWithPosition),
        "narrative-schema:load",
      );
    }
  }

  const result: NarrativeSchema[] = [];
  for (const pathWithPosition of dependenciesWithPosition) {
    const pathPosition = getPosition(pathWithPosition);
    const resolvedPath = await resolveNarrativeSchemaPath(
      getValue(pathWithPosition),
      parents[0],
    );

    // silently skip narrative schema loading if already done so
    // this is not an issue; schema dependency graph does not have to ve acyclic
    if (
      _.find(schemasAlreadyLoaded, (schema) => schema.path === resolvedPath)
    ) {
      continue;
    }

    let narrativeSchema: NarrativeSchema;

    // load narrative schema file
    try {
      const fileInMemory = _.find(
        filesInMemory,
        (f) => f.path === resolvedPath,
      );

      // TODO Improve type casting
      narrativeSchema = (fileInMemory
        ? vfile(fileInMemory)
        : await readVFile(resolvedPath, "utf8")) as NarrativeSchema;
      narrativeSchema.data = {
        labels: [],
        rules: [],
        styling: [],
      };
    } catch (e) {
      parents[0].message(
        `Unable to load narrative schema dependency ${pathWithPosition}${traceParents(
          parents,
        )}. Does file ${resolvedPath} exist?`,
        pathPosition,
        "narrative-schema:load",
      );
      continue;
    }

    result.push(narrativeSchema);

    // parse yaml
    let dataWithPosition;
    try {
      dataWithPosition = fromYaml(narrativeSchema.contents.toString());
    } catch (e) {
      try {
        narrativeSchema.fail(
          `Unable to parse schema ${traceParents(parents)}`,
          undefined,
          "narrative-schema:load",
        );
      } catch {
        // noop, just preventing Error throwing
      }
      continue;
    }

    // ensure the YAML is an object
    const dataKind = getKind(dataWithPosition);
    if (dataKind !== "object") {
      try {
        narrativeSchema.fail(
          `Expected to find an object with keys, ${dataKind} found${traceParents(
            parents,
          )}`,
          undefined,
          "narrative-schema:content",
        );
      } catch (e) {
        // noop, just preventing Error throwing
      }
      continue;
    }

    // load dependencies
    result.push(
      ...(await load(
        dataWithPosition.dependencies,
        [narrativeSchema, ...parents],
        filesInMemory,
        [...schemasAlreadyLoaded, ...result],
      )),
    );

    // extract data
    narrativeSchema.data = {
      labels: extractLabelDefinitions(dataWithPosition, narrativeSchema),
      rules: extractRuleDefinitions(dataWithPosition, narrativeSchema),
      styling: extractStylingDefinitions(dataWithPosition, narrativeSchema),
    };

    // report unknown keys in schema
    reportUnusedDataKeys(
      narrativeSchema,
      dataWithPosition,
      {
        labels: true,
        rules: true,
        styling: true,
        dependencies: true,
      },
      [],
    );
  }

  return result;
};
