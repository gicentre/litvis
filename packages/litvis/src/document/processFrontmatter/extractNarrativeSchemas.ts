import type { DataWithPosition } from "data-with-position";
import { getPosition, getValue } from "data-with-position";
import _ from "lodash";

import type { LitvisDocument } from "../../types";

export const extractNarrativeSchemas = (
  dataWithPosition: DataWithPosition,
  document: LitvisDocument,
): {
  pathsWithPosition?: DataWithPosition;
} => {
  const result: {
    pathsWithPosition?: DataWithPosition;
  } = {};

  const narrativeSchemasWithPosition = _.get(dataWithPosition, [
    "narrative-schemas",
  ]);
  const rawNarrativeSchemas = getValue(narrativeSchemasWithPosition);
  if (!_.isUndefined(rawNarrativeSchemas) && !_.isNull(rawNarrativeSchemas)) {
    result.pathsWithPosition = narrativeSchemasWithPosition;
  }

  _.forEach(
    [
      "schemaNarratives",
      "narrativeSchemas",
      "schemas",
      "schema-narratives",
      "narrative-schema",
    ],
    (mistypedKey) => {
      if (dataWithPosition[mistypedKey]) {
        document.message(
          `‘${mistypedKey}’ is not supported and so ignored. Did you mean ‘narrative-schemas’?`,
          getPosition(dataWithPosition[mistypedKey]),
          "litvis:frontmatter",
        );
      }
    },
  );

  return result;
};
