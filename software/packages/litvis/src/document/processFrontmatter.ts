import { safeLoad } from "js-yaml";
import * as _ from "lodash";
import { LitvisDocument } from ".";

function visitFrontmatter(ast, vFile: LitvisDocument) {
  const frontmatterNode = ast.children[0];
  if (!frontmatterNode) {
    return;
  }

  if (frontmatterNode.type === "toml") {
    vFile.message(
      "Only yaml frontmatter is supported",
      frontmatterNode,
      "litvis:frontmatter-format",
    );
    return;
  }

  if (frontmatterNode.type !== "yaml") {
    return;
  }

  // parse yaml
  try {
    const yaml = safeLoad(frontmatterNode.value);
    if (!frontmatterNode.data) {
      frontmatterNode.data = {};
    }
    frontmatterNode.data.yaml = yaml;
  } catch (e) {
    vFile.message(
      `Frontmatter is ignored because yaml could not be parsed: ${e.message}`,
      frontmatterNode,
      "litvis:frontmatter-parse",
    );
    return;
  }

  // all data extracted from frontmatter is saved to root ast node
  if (!ast.data) {
    ast.data = {};
  }
  // extract follows
  const frontmatterData = frontmatterNode.data.yaml || {};
  const rawLitvisFollows = frontmatterData.follows;
  let litvisFollows = null;
  if (!_.isUndefined(rawLitvisFollows) && !_.isNull(rawLitvisFollows)) {
    if (!_.isString(rawLitvisFollows)) {
      vFile.message(
        `‘follows’ has to be a string, ${typeof rawLitvisFollows} given. Value ignored.`,
        frontmatterNode,
        "litvis:frontmatter-follows",
      );
    } else if (rawLitvisFollows.match(/\n/g)) {
      vFile.message(
        `‘follows’ cannot contain newlines. Value ignored.`,
        frontmatterNode,
        "litvis:frontmatter-follows",
      );
    } else {
      litvisFollows = rawLitvisFollows.trim();
      if (litvisFollows !== rawLitvisFollows) {
        vFile.info(
          `Surrounded spaces in ‘follows’ were trimmed.`,
          frontmatterNode,
          "litvis:frontmatter-follows",
        );
      }
    }
  }
  // extract elm
  const litvisElmDependencies = {};
  const litvisElmSourceDirectories = [];
  const rawLitvisElm = frontmatterData.elm;
  if (!_.isUndefined(rawLitvisElm) && !_.isNull(rawLitvisElm)) {
    if (!_.isPlainObject(rawLitvisElm)) {
      vFile.message(
        `‘elm’ has to be an object, ${typeof rawLitvisElm} given. Value ignored.`,
        frontmatterNode,
        "litvis:frontmatter-elm",
      );
    } else {
      const processedKeys = [];

      // extract elm dependencies
      const rawLitvisElmDependencies = rawLitvisElm.dependencies;
      processedKeys.push("dependencies");
      if (
        !_.isUndefined(rawLitvisElmDependencies) &&
        !_.isNull(rawLitvisElmDependencies)
      ) {
        if (!_.isPlainObject(rawLitvisElmDependencies)) {
          vFile.message(
            `‘elm.dependencies’ has to be an object, ${typeof rawLitvisElm} given. Value ignored.`,
            frontmatterNode,
            "litvis:frontmatter-elm",
          );
        } else {
          for (const packageName in rawLitvisElmDependencies) {
            if (rawLitvisElmDependencies.hasOwnProperty(packageName)) {
              if (!packageName.match(/^([a-zA-Z0-9-])+\/([a-zA-Z0-9-])+$/)) {
                vFile.message(
                  `Wrong elm package name ${packageName} given. Package ignored.`,
                  frontmatterNode,
                  "litvis:frontmatter-elm",
                );
                continue;
              }
              let packageVersion = rawLitvisElmDependencies[packageName];
              if (_.isFinite(packageVersion)) {
                vFile.message(
                  `Using numbers as elm package version is not recommended. Wrap the value into quotes to avoid misinterpreting.`,
                  frontmatterNode,
                  "litvis:frontmatter-elm",
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
                vFile.message(
                  `Wrong elm package version ${packageVersion} given. Package ignored.`,
                  frontmatterNode,
                  "litvis:frontmatter-elm",
                );
                continue;
              }
              litvisElmDependencies[packageName] = packageVersion;
            }
          }
        }
      }
      // extract elm source-directories
      const rawLitvisElmSourceDirectories = rawLitvisElm["source-directories"];
      processedKeys.push("source-directories");
      if (
        !_.isUndefined(rawLitvisElmSourceDirectories) &&
        !_.isNull(rawLitvisElmSourceDirectories)
      ) {
        if (!_.isArray(rawLitvisElmSourceDirectories)) {
          vFile.message(
            `‘elm.source-directories’ has to be an array, ${typeof rawLitvisElm} given. Value ignored.`,
            frontmatterNode,
            "litvis:frontmatter-elm",
          );
        } else {
          rawLitvisElmSourceDirectories.forEach((dir, i) => {
            if (!_.isString(dir)) {
              vFile.message(
                `‘elm.source-directories[${i}]’ has to be a string, ${typeof dir} given. Value ignored.`,
                frontmatterNode,
                "litvis:frontmatter-source-directories",
              );
            } else if (dir.match(/\n/g)) {
              vFile.message(
                `‘elm.source-directories[${i}]’ cannot contain newlines. Value ignored.`,
                frontmatterNode,
                "litvis:frontmatter-source-directories",
              );
            } else {
              const normalizedDir = dir.trim();
              if (normalizedDir !== dir) {
                vFile.info(
                  `Surrounded spaces in ‘elm.source-directories[${i}]’ were trimmed.`,
                  frontmatterNode,
                  "litvis:frontmatter-source-directories",
                );
              }
              litvisElmSourceDirectories.push(dir);
            }
          });
        }
      }

      const unusedKeys = _.without(_.keys(rawLitvisElm), ...processedKeys);
      unusedKeys.forEach((k) => {
        vFile.message(
          `‘elm.${k}’ is not supported and so ignored. Supported properties: ${processedKeys.join(
            ", ",
          )}.`,
          frontmatterNode,
          "litvis:frontmatter-elm",
        );
      });
    }
  }

  // narrative schemas
  let litvisNarrativeSchemas = null;
  const rawLitvisNarrativeSchemas = frontmatterData["narrative-schemas"];
  if (
    !_.isUndefined(rawLitvisNarrativeSchemas) &&
    !_.isNull(rawLitvisNarrativeSchemas)
  ) {
    litvisNarrativeSchemas = [];
    if (!_.isArray(rawLitvisNarrativeSchemas)) {
      vFile.message(
        `‘narrative-schemas’ has to be an array, ${typeof rawLitvisNarrativeSchemas} given. Value ignored.`,
        frontmatterNode,
        "litvis:frontmatter-narrative-schemas",
      );
    } else {
      rawLitvisNarrativeSchemas.forEach((path, i) => {
        if (!_.isString(path)) {
          vFile.message(
            `‘narrative-schemas[${i}]’ has to be a string, ${typeof path} given. Value ignored.`,
            frontmatterNode,
            "litvis:frontmatter-narrative-schemas",
          );
        } else if (path.match(/\n/g)) {
          vFile.message(
            `‘narrative-schemas[${i}]’ cannot contain newlines. Value ignored.`,
            frontmatterNode,
            "litvis:frontmatter-narrative-schemas",
          );
        } else {
          const normalizedDir = path.trim();
          if (normalizedDir !== path) {
            vFile.info(
              `Surrounded spaces in ‘narrative-schemas[${i}]’ were trimmed.`,
              frontmatterNode,
              "litvis:frontmatter-narrative-schemas",
            );
          }
          litvisNarrativeSchemas.push(path);
        }
      });
    }
  }

  if (typeof litvisNarrativeSchemas === "undefined") {
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
          vFile.message(
            `‘${mistypedKey}’ is not supported and so ignored. Did you mean ‘narrative-schemas’?`,
            frontmatterNode,
            "litvis:frontmatter",
          );
        }
      },
    );
  }

  vFile.data.litvisFollows = litvisFollows;
  vFile.data.litvisElmDependencies = litvisElmDependencies;
  vFile.data.litvisElmSourceDirectories = litvisElmSourceDirectories;
  vFile.data.litvisNarrativeSchemas = litvisNarrativeSchemas;
}

export default function() {
  return function transformer(ast, vFile, next) {
    visitFrontmatter(ast, vFile);

    if (typeof next === "function") {
      return next(null, ast, vFile);
    }

    return ast;
  };
}
