import _ from "lodash";
import type { Attacher } from "unified";
import type { Node, Parent } from "unist";
import visit from "unist-util-visit";
import type { VFile } from "vfile";

import { resolveExpressions } from "../attributeDerivatives";
import type {
  AttributeDerivatives,
  CodeBlock,
  OutputExpression,
  OutputFormat,
  TripleHatReferenceNode,
} from "../types";

const visitCodeBlock = (ast: Node, vFile: VFile) => {
  return visit<CodeBlock>(ast, "code", (codeBlockNode, index, parent) => {
    if (!codeBlockNode.data || !codeBlockNode.data.litvisAttributeDerivatives) {
      return;
    }

    // do not re-visit the same code block twice
    if (codeBlockNode.data.visitedByExtractOutputItems) {
      return;
    }
    codeBlockNode.data.visitedByExtractOutputItems = true;

    const nodesBefore: OutputExpression[] = [];
    const nodesAfter: OutputExpression[] = [];
    let nodes = nodesBefore;
    const derivatives = resolveExpressions(
      codeBlockNode.data.litvisAttributeDerivatives,
      codeBlockNode.value,
    );

    derivatives.outputFormats.forEach((outputFormat) => {
      switch (outputFormat) {
        case "l":
          nodes = nodesAfter;
          break;
        default: {
          const expressions =
            derivatives.outputExpressionsByFormat[outputFormat] || [];
          nodes.push(
            ...expressions.map((expression) => ({
              type: "outputExpression",
              position: codeBlockNode.position,
              value: expression,
              data: {
                text: expression,
                outputFormat: outputFormat as any as OutputFormat,
                contextName: derivatives.contextName,
              },
            })),
          );
        }
      }
    });
    const resultingNodes: Parent[] = [];
    if (nodesBefore.length) {
      resultingNodes.push({
        type: "outputExpressionGroup",
        children: nodesBefore,
      });
    }
    resultingNodes.push(codeBlockNode);
    if (nodesAfter.length) {
      resultingNodes.push({
        type: "outputExpressionGroup",
        children: nodesAfter,
      });
    }
    parent?.children.splice(index, 1, ...resultingNodes);
  });
};

const visitTripleHatReference = (ast: Node, vFile: VFile) => {
  return visit<TripleHatReferenceNode>(
    ast,
    "tripleHatReference",
    (tripleHatReferenceNode) => {
      if (
        !tripleHatReferenceNode.data ||
        !tripleHatReferenceNode.data.litvisAttributeDerivatives
      ) {
        return;
      }
      const nodes: OutputExpression[] = [];
      const derivatives: AttributeDerivatives =
        tripleHatReferenceNode.data.litvisAttributeDerivatives;
      derivatives.outputFormats.forEach((outputFormat) => {
        switch (outputFormat) {
          case "l":
            vFile.message(
              "Use of l is not allowed in triple hat references.",
              tripleHatReferenceNode,
              "litvis:triple-hat-reference-use",
            );
            break;
          default: {
            const expressions =
              derivatives.outputExpressionsByFormat[outputFormat];
            if (_.isArray(expressions)) {
              nodes.push(
                ...expressions.map((expression) => ({
                  type: "outputExpression",
                  position: tripleHatReferenceNode.position,
                  value: expression,
                  data: {
                    text: expression,
                    outputFormat: outputFormat as any as OutputFormat,
                    contextName: derivatives.contextName,
                  },
                })),
              );
            } else {
              vFile.message(
                `${outputFormat} should be followed by a list of expressions in triple hat references.`,
                tripleHatReferenceNode,
                "litvis:triple-hat-reference-use",
              );
            }
          }
        }
        tripleHatReferenceNode.children = nodes;
      });
    },
  );
};

// @ts-expect-error -- TODO: investigate type mismatch
export const extractOutputItems: Attacher = () => {
  return function transformer(ast, vFile, next) {
    visitCodeBlock(ast, vFile);
    visitTripleHatReference(ast, vFile);

    if (typeof next === "function") {
      return next(null, ast, vFile);
    }

    return ast;
  };
};
