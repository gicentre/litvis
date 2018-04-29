import * as _ from "lodash";
import convertPseudoYamlAstLocToPosition from "../../convertPseudoYamlAstLocToPosition";
import { LitvisDocument, PseudoAstNode } from "../../types";
// @ts-ignore
import { Node, Position, VFileBase } from "../../types";

export default (
  pseudoYamlAst,
  document: LitvisDocument,
): {
  pseudoAstNodes: PseudoAstNode[];
} => {
  const result: {
    pseudoAstNodes: PseudoAstNode[];
  } = {
    pseudoAstNodes: [],
  };

  const pseudoAstNode = _.get(pseudoYamlAst, ["narrative-schemas"]);

  if (!pseudoAstNode) {
    return result;
  }

  const rawNarrativeSchemas = pseudoAstNode.valueOf();
  if (_.isUndefined(rawNarrativeSchemas) || _.isNull(rawNarrativeSchemas)) {
    // do not do anything if narrative schemas are not defined
  } else if (!_.isArray(rawNarrativeSchemas)) {
    document.message(
      `‘narrative-schemas’ has to be an array, ${typeof rawNarrativeSchemas} given. Value ignored.`,
      convertPseudoYamlAstLocToPosition(pseudoAstNode),
      "litvis:frontmatter-narrative-schemas",
    );
  } else {
    rawNarrativeSchemas.forEach((pathNode, i) => {
      const value = pathNode.valueOf();
      const position = convertPseudoYamlAstLocToPosition(pathNode);
      if (!_.isString(value)) {
        document.message(
          `‘narrative-schemas[${i}]’ has to be a string, ${typeof value} given. Value ignored.`,
          position,
          "litvis:frontmatter-narrative-schemas",
        );
      } else if (value.match(/\n/g)) {
        document.message(
          `‘narrative-schemas[${i}]’ cannot contain line breaks. Value ignored.`,
          position,
          "litvis:frontmatter-narrative-schemas",
        );
      } else {
        const normalizedValue = value.trim();
        if (normalizedValue !== value) {
          document.info(
            `Surrounded spaces in ‘narrative-schemas[${i}]’ were trimmed.`,
            position,
            "litvis:frontmatter-narrative-schemas",
          );
        }
        result.pseudoAstNodes.push(pathNode);
      }
    });
  }

  if (typeof rawNarrativeSchemas === "undefined") {
    _.forEach(
      [
        "schemaNarratives",
        "narrativeSchemas",
        "schemas",
        "schema-narratives",
        "narrative-schema",
      ],
      (mistypedKey) => {
        if (typeof mistypedKey !== "undefined") {
          document.message(
            `‘${mistypedKey}’ is not supported and so ignored. Did you mean ‘narrative-schemas’?`,
            convertPseudoYamlAstLocToPosition(pseudoYamlAst[mistypedKey]),
            "litvis:frontmatter",
          );
        }
      },
    );
  }
  return result;
};
