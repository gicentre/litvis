import * as _ from "lodash";
import convertPseudoYamlAstLocToPosition from "../../convertPseudoYamlAstLocToPosition";
import { LitvisDocument } from "../../types";
// @ts-ignore
import { Node, Position, PseudoAstNode, VFileBase } from "../../types";

const supportedProperties = ["dependencies", "source-directories"];

export default (yamlAst, document: LitvisDocument): void => {
  if (!_.isUndefined(yamlAst.elm)) {
    const rawLitvisElm = yamlAst.elm.valueOf();
    if (_.isNull(rawLitvisElm)) {
      // ignore null value
    } else if (!_.isPlainObject(rawLitvisElm)) {
      document.message(
        `‘elm’ has to be an object, ${typeof rawLitvisElm} given. Value ignored.`,
        convertPseudoYamlAstLocToPosition(yamlAst.elm),
        "litvis:frontmatter:elm:dependencies",
      );
    } else {
      const unusedKeys = _.without(
        _.keys(rawLitvisElm),
        ...supportedProperties,
      );
      unusedKeys.forEach((k) => {
        document.message(
          `‘elm.${k}’ is not supported and so ignored. Supported properties: ${supportedProperties.join(
            ", ",
          )}.`,
          convertPseudoYamlAstLocToPosition(yamlAst.elm[k]),
          "litvis:frontmatter:elm",
        );
      });
    }
  }
};
