import { DataWithPosition, fromYaml } from "data-with-position";
import { Node } from "unist";

import { LitvisDocument } from "../../types";
import { extractElmDependencies } from "./extractElmDependencies";
import { extractElmSourceDirectories } from "./extractElmSourceDirectories";
import { extractFollows } from "./extractFollows";
import { extractNarrativeSchemas } from "./extractNarrativeSchemas";
import { lintElm } from "./lintElm";

const visitFrontmatter = (mdAst, document: LitvisDocument) => {
  const frontmatterNode: Node = mdAst.children[0];
  if (!frontmatterNode) {
    return;
  }

  if (frontmatterNode.type === "toml") {
    document.message(
      "Only yaml frontmatter is supported",
      frontmatterNode,
      "litvis:frontmatter-format",
    );

    return;
  }

  if (frontmatterNode.type !== "yaml" || !frontmatterNode.position) {
    return;
  }

  // extract yaml pseudo ast
  let dataWithPosition: DataWithPosition;
  try {
    const valueWithOffset =
      "\n".repeat(frontmatterNode.position.start.line) +
      frontmatterNode["value"];
    dataWithPosition = fromYaml(valueWithOffset);
    if (!frontmatterNode.data) {
      frontmatterNode.data = {};
    }
    frontmatterNode.data.dataWithPosition = dataWithPosition;
  } catch (e) {
    document.message(
      `Frontmatter is ignored because yaml could not be parsed: ${e.message}`,
      frontmatterNode,
      "litvis:frontmatter-parse",
    );

    return;
  }

  lintElm(dataWithPosition, document);

  const { value: litvisFollows, position: litvisFollowsPosition } =
    extractFollows(dataWithPosition, document);
  document.data.litvisFollowsPath = litvisFollows;
  document.data.litvisFollowsPosition = litvisFollowsPosition;

  const { versions: elmDependencyVersions, positions: elmDependencyPositions } =
    extractElmDependencies(dataWithPosition, document);
  document.data.litvisElmDependencyVersions = elmDependencyVersions;
  document.data.litvisElmDependencyPositions = elmDependencyPositions;

  const {
    paths: elmSourceDirectoryPaths,
    positions: elmSourceDirectoryPositions,
  } = extractElmSourceDirectories(dataWithPosition, document);
  document.data.litvisElmSourceDirectoryPaths = elmSourceDirectoryPaths;
  document.data.litvisElmSourceDirectoryPositions = elmSourceDirectoryPositions;

  const { pathsWithPosition: narrativeSchemasWithPosition } =
    extractNarrativeSchemas(dataWithPosition, document);
  document.data.litvisNarrativeSchemasWithPosition =
    narrativeSchemasWithPosition;
};

export const processFrontmatter = () => {
  return function transformer(ast, vFile, next) {
    // try {
    visitFrontmatter(ast, vFile);
    // } catch (e) {
    //   console.log(e.stack);
    //   throw e;
    // }

    if (typeof next === "function") {
      return next(null, ast, vFile);
    }

    return ast;
  };
};
