import { parseBlockInfo } from "block-info";
import type { Attacher } from "unified";
import type { Node } from "unist";
import visit from "unist-util-visit";
import type { VFile } from "vfile";

import { extractAttributeDerivatives as doExtractAttributeDerivatives } from "../attribute-derivatives";
import type { CodeBlock } from "../types";

const visitCodeBlock = (ast: Node, vFile: VFile) => {
  return visit<CodeBlock>(ast, "code", (codeBlockNode) => {
    if (!codeBlockNode.data) {
      codeBlockNode.data = {};
    }
    const parsedInfo = parseBlockInfo(
      `${codeBlockNode.lang || ""} ${codeBlockNode["meta"] || ""}`,
    );
    const normalizedLanguage = (parsedInfo.language || "").trim().toLowerCase();
    if (normalizedLanguage === "elm") {
      const attributeDerivatives = doExtractAttributeDerivatives(
        parsedInfo.attributes,
      );
      if (attributeDerivatives) {
        codeBlockNode.data.litvisAttributeDerivatives = attributeDerivatives;

        return;
      }
      // if ((codeBlockNode.lang || "").trim().length !== 3) {
      //   vFile.message(
      //     `Could not extract attribute derivatives from ${codeBlockNode.lang}`,
      //     codeBlockNode,
      //     "litvis:code-block-syntax",
      //   );
      // }

      return;
    }
  });
};

const visitTripleHatReference = (ast: Node, vFile: VFile) => {
  return visit<CodeBlock>(
    ast,
    "tripleHatReference",
    (tripleHatReferenceNode) => {
      const parsedInfo = parseBlockInfo(tripleHatReferenceNode.data.info);
      if ((parsedInfo.language || "").toLowerCase() === "elm") {
        const attributeDerivatives = doExtractAttributeDerivatives(
          parsedInfo.attributes,
        );
        if (attributeDerivatives) {
          tripleHatReferenceNode.data.litvisAttributeDerivatives =
            attributeDerivatives;

          return;
        }
        vFile.message(
          `Could not extract attribute derivatives from ${tripleHatReferenceNode.data.info}`,
          tripleHatReferenceNode,
          "litvis:triple-hat-reference-syntax",
        );

        return;
      }
      vFile.message(
        `^^^ must be followed by elm (^^^elm)`,
        tripleHatReferenceNode,
        "litvis:triple-hat-reference-syntax",
      );
    },
  );
};

// @ts-expect-error -- TODO: investigate type mismatch
export const extractAttributeDerivatives: Attacher = () => {
  return function transformer(ast, vFile, next) {
    visitCodeBlock(ast, vFile);
    visitTripleHatReference(ast, vFile);

    if (typeof next === "function") {
      return next(null, ast, vFile);
    }

    return ast;
  };
};
