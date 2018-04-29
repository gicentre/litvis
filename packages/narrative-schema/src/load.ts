import {
  DataWithPosition,
  fromYaml,
  getKind,
  getPosition,
  getValue,
} from "data-with-position";
import * as _ from "lodash";
import { extractDefinitions as extractLabelDefinitions } from "narrative-schema-label";
import { extractDefinitions as extractRuleDefinitions } from "narrative-schema-rule";
import { extractDefinitions as extractStylingDefinitions } from "narrative-schema-styling";
import { resolve } from "path";
import { read as readVFile } from "to-vfile";
import * as vfile from "vfile";
import traceParents from "./traceParents";
import { NarrativeSchema } from "./types";
// @ts-ignore
import { NarrativeSchemaData } from "./types";

const load = async <Document extends vfile.VFileBase<any>>(
  dependenciesWithPosition: DataWithPosition,
  parents: Array<Document | NarrativeSchema<Document>>,
  filesInMemory: Array<vfile.VFileBase<{}>>,
  schemasAlreadyLoaded: Array<NarrativeSchema<Document>>,
): Promise<Array<NarrativeSchema<Document>>> => {
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

  const result: Array<NarrativeSchema<Document>> = [];
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

    let narrativeSchema: NarrativeSchema<Document>;

    // load narrative schema file
    try {
      const fileInMemory = _.find(
        filesInMemory,
        (f) => f.path === resolvedPath,
      );
      narrativeSchema = fileInMemory
        ? vfile(fileInMemory)
        : await readVFile(resolvedPath, "utf8");
    } catch (e) {
      parents[0].message(
        `Unable to load narrative schema dependency ${pathWithPosition}${traceParents(
          parents,
        )}. Does this file ${resolvedPath} exist?`,
        pathPosition,
        "narrative-schema:load",
      );
      continue;
    }

    narrativeSchema.data = {
      labels: [],
      rules: [],
      styling: [],
    };

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
      } catch (e) {
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
      labels: extractLabelDefinitions(dataWithPosition),
      rules: extractRuleDefinitions(dataWithPosition),
      styling: extractStylingDefinitions(dataWithPosition),
    };

    // report unknown keys in schema
    const knownKeys = ["labels", "rules", "styling", "dependencies"];
    const foundKeys = Object.keys(dataWithPosition);
    const unknownKeys = _.difference(foundKeys, knownKeys);
    for (const key of unknownKeys) {
      narrativeSchema.message(
        `Did not expect to find "${key}", expected ${knownKeys.join(
          ", ",
        )}${traceParents(parents)}`,
        getPosition(dataWithPosition[key]),
        "narrative-schema:content",
      );
    }
  }
  return result;
};

export default load;

const resolveNarrativeSchemaPath = async <
  Document extends vfile.VFileBase<any>
>(
  path,
  file: Document | NarrativeSchema<Document>,
): Promise<string> => {
  let result = resolve(file.dirname!, path);
  if (
    !_.endsWith(result.toLowerCase(), ".yml") &&
    !_.endsWith(result.toLowerCase(), ".yaml")
  ) {
    result += ".yml";
  }
  return result;
};
