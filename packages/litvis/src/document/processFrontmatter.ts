import extractAst, { loc } from "@kachkaev/pseudo-yaml-ast";
import { NodeWithPosition } from "vfile";
import { LitvisDocument } from "../types";
import extractElmDependencies from "./frontmatter/extractElmDependencies";
import extractElmSourceDirectories from "./frontmatter/extractElmSourceDirectories";
import extractFollows from "./frontmatter/extractFollows";
import extractNarrativeSchemas from "./frontmatter/extractNarrativeSchemas";
import lintElm from "./frontmatter/lintElm";

function visitFrontmatter(mdAst, document: LitvisDocument) {
  const frontmatterNode: NodeWithPosition = mdAst.children[0];
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

  if (frontmatterNode.type !== "yaml") {
    return;
  }

  // extract yaml pseudo ast
  let yamlAst;
  try {
    const valueWithOffset =
      "\n".repeat(frontmatterNode.position.start.line) + frontmatterNode.value;
    yamlAst = extractAst(valueWithOffset);
    if (!frontmatterNode.data) {
      frontmatterNode.data = {};
    }
    frontmatterNode.data.yamlAst = yamlAst;
  } catch (e) {
    document.message(
      `Frontmatter is ignored because yaml could not be parsed: ${e.message}`,
      frontmatterNode,
      "litvis:frontmatter-parse",
    );
    return;
  }

  lintElm(yamlAst, document);

  const {
    value: litvisFollows,
    position: litvisFollowsPosition,
  } = extractFollows(yamlAst, document);
  document.data.litvisFollowsPath = litvisFollows;
  document.data.litvisFollowsPosition = litvisFollowsPosition;

  const {
    versions: elmDependencyVersions,
    positions: elmDependencyPositions,
  } = extractElmDependencies(yamlAst, document);
  document.data.litvisElmDependencyVersions = elmDependencyVersions;
  document.data.litvisElmDependencyPositions = elmDependencyPositions;

  const {
    paths: elmSourceDirectoryPaths,
    positions: elmSourceDirectoryPositions,
  } = extractElmSourceDirectories(yamlAst, document);
  document.data.litvisElmSourceDirectoryPaths = elmSourceDirectoryPaths;
  document.data.litvisElmSourceDirectoryPositions = elmSourceDirectoryPositions;

  const {
    pseudoAstNodes: narrativeSchemaPseudoYamlAstNodes,
  } = extractNarrativeSchemas(yamlAst, document);
  document.data.litvisNarrativeSchemaPseudoAstNodesWithPaths = narrativeSchemaPseudoYamlAstNodes;
}

export default function() {
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
}
