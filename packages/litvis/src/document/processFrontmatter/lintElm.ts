import { DataWithPosition, getPosition, getValue } from "data-with-position";
import kindOf from "kind-of";
import _ from "lodash";

import { LitvisDocument } from "../../types";

const supportedProperties = ["dependencies", "source-directories"];

export const lintElm = (
  dataWithPosition: DataWithPosition,
  document: LitvisDocument,
): void => {
  if (!_.isUndefined(dataWithPosition.elm)) {
    const elm = getValue(dataWithPosition.elm);
    if (_.isNull(elm)) {
      // ignore null value
    } else if (!_.isPlainObject(elm)) {
      document.message(
        `‘elm’ has to be an object, ${kindOf(elm)} given. Value ignored.`,
        getPosition(dataWithPosition.elm),
        "litvis:frontmatter:elm:dependencies",
      );
    } else {
      const unusedKeys = _.without(_.keys(elm), ...supportedProperties);
      unusedKeys.forEach((k) => {
        document.message(
          `‘elm.${k}’ is not supported and so ignored. Supported properties: ${supportedProperties.join(
            ", ",
          )}.`,
          getPosition(dataWithPosition.elm[k]),
          "litvis:frontmatter:elm",
        );
      });
    }
    if (dataWithPosition.dependencies && (!elm || !elm.dependencies)) {
      const elmPosition = getPosition(dataWithPosition.elm);
      const dependenciesPosition = getPosition(dataWithPosition.dependencies);
      if (dependenciesPosition.start.line > elmPosition.end.line) {
        document.message(
          `It seems that you are missing indentation before ‘dependencies’ and its sub-nodes. Without leading spaces, the value is not considered as a child node of ‘elm’.`,
          dependenciesPosition,
          "litvis:frontmatter:elm:dependencies",
        );
      }
    }
  }
};
