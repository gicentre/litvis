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
  versions: { [packageName: string]: string | false };
  positions: { [packageName: string]: Position };
} => {
  const result = {
    versions: {},
    positions: {},
  };

  const dependenciesWithPosition = _.get(dataWithPosition, [
    "elm",
    "dependencies",
  ]);

  if (!dependenciesWithPosition) {
    return result;
  }

  const dependencies = getValue(dependenciesWithPosition);
  if (_.isUndefined(dependencies) || _.isNull(dependencies)) {
    // do not do anything if elm dependencies are not defined
  } else if (!_.isPlainObject(dependencies)) {
    document.message(
      `‘elm.dependencies’ has to be an object, ${kindOf(
        dependencies,
      )} given. Value ignored.`,
      getPosition(dependenciesWithPosition),
      "litvis:frontmatter:elm:dependencies",
    );
  } else {
    for (const packageName in dependenciesWithPosition) {
      if (dependenciesWithPosition.hasOwnProperty(packageName)) {
        const packagePosition = getPosition(
          dependenciesWithPosition[packageName],
        );
        if (!packageName.match(/^([a-zA-Z0-9-])+\/([a-zA-Z0-9-])+$/)) {
          document.message(
            `Wrong elm package name ${packageName} given. Package ignored.`,
            packagePosition,
            "litvis:frontmatter:elm:dependencies",
          );
          continue;
        }
        let packageVersion = getValue(dependenciesWithPosition[packageName]);
        if (_.isFinite(packageVersion)) {
          document.message(
            `Using numbers as elm package version is not recommended. Wrap the value into quotes to avoid misinterpreting.`,
            packagePosition,
            "litvis:frontmatter:elm:dependencies",
          );
          packageVersion = `${packageVersion}`;
        }
        if (packageVersion !== false && packageVersion !== "latest") {
          if (
            _.isString(packageVersion) &&
            packageVersion.match(/^\d+(\.\d+){0,2}$/)
          ) {
            document.message(
              `Installing custom package versions is not yet supported by elm 0.19. Falling back to latest.`,
              packagePosition,
              "litvis:frontmatter:elm:dependencies",
            );
          } else {
            document.message(
              `Wrong elm package version ${packageVersion} given. Package ignored.`,
              packagePosition,
              "litvis:frontmatter:elm:dependencies",
            );
            continue;
          }
        }
        result.versions[packageName] =
          packageVersion === false ? false : "latest";
        result.positions[packageName] = packageVersion;
      }
    }
  }

  return result;
};
