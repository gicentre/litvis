import * as _ from "lodash";
import convertPseudoYamlAstLocToPosition from "../../convertPseudoYamlAstLocToPosition";
import { LitvisDocument } from "../../types";
// @ts-ignore
import { Node, Position, PseudoAstNode, VFileBase } from "../../types";

export default (
  pseudoYamlAst,
  document: LitvisDocument,
): {
  value?: string;
  position?: Position;
} => {
  const pseudoYamlAstNode = pseudoYamlAst.follows;
  if (!_.isUndefined(pseudoYamlAstNode)) {
    const rawValue = pseudoYamlAstNode.valueOf();
    const position = convertPseudoYamlAstLocToPosition(pseudoYamlAstNode);
    if (_.isNull(rawValue)) {
      // ignore null value
    } else if (!_.isString(rawValue)) {
      document.message(
        `‘follows’ has to be a string, ${typeof rawValue} given. Value ignored.`,
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
      const value = rawValue.trim();
      if (value !== rawValue) {
        document.info(
          `Surrounded spaces in ‘follows’ were trimmed.`,
          position,
          "litvis:frontmatter-follows",
        );
      }
      return {
        value: rawValue.trim(),
        position,
      };
    }
  }
  return {};
};
