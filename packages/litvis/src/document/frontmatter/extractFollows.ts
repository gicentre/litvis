import { getPosition, getValue } from "data-with-position";
import kindOf from "kind-of";
import _ from "lodash";
import { LitvisDocument, Position } from "../../types";

// @ts-ignore
import { Parent, VFileBase } from "../../types";

export default (
  dataWithPosition,
  document: LitvisDocument,
): {
  value?: string;
  position?: Position;
} => {
  const followsWithPosition = dataWithPosition.follows;
  if (!_.isUndefined(followsWithPosition)) {
    const rawValue = getValue(followsWithPosition);
    const position = getPosition(followsWithPosition);
    if (_.isNull(rawValue)) {
      // ignore null value
    } else if (!_.isString(rawValue)) {
      document.message(
        `‘follows’ has to be a string, ${kindOf(
          rawValue,
        )} given. Value ignored.`,
        position,
        "litvis:frontmatter-follows",
      );
    } else if (rawValue.match(/\n/g)) {
      document.message(
        `‘follows’ cannot contain newlines. Value ignored.`,
        position,
        "litvis:frontmatter-follows",
      );
    } else {
      const normalizedValue = rawValue.trim();
      if (normalizedValue !== rawValue) {
        document.info(
          `Surrounded spaces in ‘follows’ were trimmed.`,
          position,
          "litvis:frontmatter-follows",
        );
      }
      return {
        value: normalizedValue,
        position,
      };
    }
  }
  return {};
};
