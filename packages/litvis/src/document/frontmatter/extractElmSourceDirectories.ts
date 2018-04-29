import * as _ from "lodash";
import convertPseudoYamlAstLocToPosition from "../../convertPseudoYamlAstLocToPosition";
import { LitvisDocument } from "../../types";
// @ts-ignore
import { Node, Position, PseudoAstNode, VFileBase } from "../../types";

export default (
  pseudoYamlAst,
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

  const pseudoAstNode = _.get(pseudoYamlAst, ["elm", "source-directories"]);

  if (!pseudoAstNode) {
    return result;
  }

  const pseudoAstNodeValue = pseudoAstNode.valueOf();

  if (_.isUndefined(pseudoAstNodeValue) || _.isNull(pseudoAstNodeValue)) {
    // do not do anything if elm source-directories are not defined
  } else if (!_.isArray(pseudoAstNodeValue)) {
    document.message(
      `‘elm.source-directories’ has to be an array, ${typeof pseudoAstNodeValue} given. Value ignored.`,
      convertPseudoYamlAstLocToPosition(pseudoAstNode),
      "litvis:frontmatter:elm",
    );
  } else {
    pseudoAstNode.forEach((pathNode, i) => {
      const value = pathNode.valueOf();
      const position = convertPseudoYamlAstLocToPosition(pathNode);
      if (typeof value !== "string") {
        document.message(
          `‘elm.source-directories[${i}]’ has to be a string, ${typeof value} given. Value ignored.`,
          position,
          "litvis:frontmatter:elm:source-directories",
        );
      } else if (value.match(/\n/g)) {
        document.message(
          `‘elm.source-directories[${i}]’ cannot contain newlines. Value ignored.`,
          position,
          "litvis:frontmatter:elm:source-directories",
        );
      } else {
        const normalizedValue = value.trim();
        if (normalizedValue !== value) {
          document.info(
            `Surrounded spaces in ‘elm.source-directories[${i}]’ were trimmed.`,
            position,
            "litvis:frontmatter:elm:source-directories",
          );
        }
        result.paths.push(normalizedValue);
        result.positions.push(position);
      }
    });
  }

  return result;
};
