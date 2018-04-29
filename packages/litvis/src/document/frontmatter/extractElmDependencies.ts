import * as _ from "lodash";
import convertPseudoYamlAstLocToPosition from "../../convertPseudoYamlAstLocToPosition";
import { LitvisDocument } from "../../types";
// @ts-ignore
import { Node, Position, PseudoAstNode, VFileBase } from "../../types";

export default (
  pseudoYamlAst,
  document: LitvisDocument,
): {
  versions: { [packageName: string]: string | false };
  positions: { [packageName: string]: Position };
} => {
  const result = {
    versions: {},
    positions: {},
  };

  const pseudoAstNode = _.get(pseudoYamlAst, ["elm", "dependencies"]);

  if (!pseudoAstNode) {
    return result;
  }

  const pseudoAstNodeValue = pseudoAstNode.valueOf();
  if (_.isUndefined(pseudoAstNodeValue) || _.isNull(pseudoAstNodeValue)) {
    // do not do anything if elm dependencies are not defined
  } else if (!_.isPlainObject(pseudoAstNodeValue)) {
    document.message(
      `‘elm.dependencies’ has to be an object, ${typeof pseudoAstNodeValue} given. Value ignored.`,
      convertPseudoYamlAstLocToPosition(pseudoAstNode),
      "litvis:frontmatter:elm:dependencies",
    );
  } else {
    for (const packageName in pseudoAstNode) {
      if (pseudoAstNode.hasOwnProperty(packageName)) {
        const position = convertPseudoYamlAstLocToPosition(
          pseudoAstNode[packageName],
        );
        if (!packageName.match(/^([a-zA-Z0-9-])+\/([a-zA-Z0-9-])+$/)) {
          document.message(
            `Wrong elm package name ${packageName} given. Package ignored.`,
            position,
            "litvis:frontmatter:elm:dependencies",
          );
          continue;
        }
        let packageVersion = pseudoAstNode[packageName].valueOf();
        if (_.isFinite(packageVersion)) {
          document.message(
            `Using numbers as elm package version is not recommended. Wrap the value into quotes to avoid misinterpreting.`,
            position,
            "litvis:frontmatter:elm:dependencies",
          );
          packageVersion = `${packageVersion}`;
        }
        if (
          packageVersion !== false &&
          packageVersion !== "latest" &&
          !(
            _.isString(packageVersion) &&
            packageVersion.match(/^\d+(\.\d+){0,2}$/)
          )
        ) {
          document.message(
            `Wrong elm package version ${packageVersion} given. Package ignored.`,
            position,
            "litvis:frontmatter:elm:dependencies",
          );
          continue;
        }
        result.versions[packageName] = packageVersion;
        result.positions[packageName] = packageVersion;
      }
    }
  }

  return result;
};
