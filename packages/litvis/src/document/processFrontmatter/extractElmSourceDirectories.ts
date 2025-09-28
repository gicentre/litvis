import type { DataWithPosition } from "data-with-position";
import { getPosition, getValue } from "data-with-position";
import kindOf from "kind-of";
import _ from "lodash";
import type { Position } from "unist";

import type { LitvisDocument } from "../../types";

export const extractElmSourceDirectories = (
  dataWithPosition: DataWithPosition,
  document: LitvisDocument,
): {
  paths: string[];
  positions: Position[];
} => {
  const result: {
    paths: string[];
    positions: Position[];
  } = {
    paths: [],
    positions: [],
  };

  const sourceDirectoriesWithPosition = _.get(dataWithPosition, [
    "elm",
    "source-directories",
  ]);

  if (!sourceDirectoriesWithPosition) {
    return result;
  }

  const sourceDirectories = getValue(sourceDirectoriesWithPosition);
  if (_.isUndefined(sourceDirectories) || _.isNull(sourceDirectories)) {
    // do not do anything if elm source-directories are not defined
  } else if (!_.isArray(sourceDirectories)) {
    document.message(
      `‘elm.source-directories’ has to be an array, ${kindOf(
        sourceDirectories,
      )} given. Value ignored.`,
      getPosition(sourceDirectoriesWithPosition),
      "litvis:frontmatter:elm",
    );
  } else {
    (sourceDirectoriesWithPosition as DataWithPosition[]).forEach(
      (pathWithPosition, i) => {
        const path = getValue(pathWithPosition);
        const position = getPosition(pathWithPosition);
        if (typeof path !== "string") {
          document.message(
            `‘elm.source-directories[${i}]’ has to be a string, ${kindOf(
              path,
            )} given. Value ignored.`,
            position,
            "litvis:frontmatter:elm:source-directories",
          );
        } else if (path.match(/\n/g)) {
          document.message(
            `‘elm.source-directories[${i}]’ cannot contain newlines. Value ignored.`,
            position,
            "litvis:frontmatter:elm:source-directories",
          );
        } else {
          const normalizedPath = path.trim();
          if (normalizedPath !== path) {
            document.info(
              `Surrounded spaces in ‘elm.source-directories[${i}]’ were trimmed.`,
              position,
              "litvis:frontmatter:elm:source-directories",
            );
          }
          result.paths.push(normalizedPath);
          result.positions.push(position);
        }
      },
    );
  }

  return result;
};
