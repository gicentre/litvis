import type { DataWithPosition } from "data-with-position";
import { fromYaml } from "data-with-position";
import type { TomlNode, YamlNode } from "remark-frontmatter";
import type { Attacher } from "unified";
import type { Node, Parent } from "unist";

import type { LitvisDocument } from "../../types";
import { extractElmDependencies } from "./extract-elm-dependencies";
import { extractElmSourceDirectories } from "./extract-elm-source-directories";
import { extractFollows } from "./extract-follows";
import { extractNarrativeSchemas } from "./extract-narrative-schemas";
import { lintElm } from "./lint-elm";

const visitFrontmatter = (mdAst: Node, document: LitvisDocument) => {
  const frontmatterNode = (mdAst as Parent)?.children[0] as
    | YamlNode
    | TomlNode
    | undefined;
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
    frontmatterNode.data["dataWithPosition"] = dataWithPosition;
  } catch (error) {
    document.message(
      `Frontmatter is ignored because yaml could not be parsed: ${error instanceof Error ? error.message : String(error)}`,
      frontmatterNode,
      "litvis:frontmatter-parse",
    );

    return;
  }

  lintElm(dataWithPosition, document);

  const { value: litvisFollows, position: litvisFollowsPosition } =
    extractFollows(dataWithPosition, document);
  if (litvisFollows) {
    document.data.litvisFollowsPath = litvisFollows;
  }
  if (litvisFollowsPosition) {
    document.data.litvisFollowsPosition = litvisFollowsPosition;
  }

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

// @ts-expect-error -- TODO: investigate type mismatch
export const processFrontmatter: Attacher = () => {
  return function transformer(ast, vFile, next) {
    // try {
    visitFrontmatter(ast as Parent, vFile as LitvisDocument);
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
