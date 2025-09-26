import { Node, Parent } from "unist";
import visit from "unist-util-visit";
import { VFile } from "vfile";

import { LabelNode } from "../types";
import { markLabelNodeAsErroneous } from "../utils";

export const pairLabels = () => (ast: Node, vFile: VFile) => {
  return visit<LabelNode>(
    ast,
    "narrativeSchemaLabel",
    (labelNode, index, parent: Parent | undefined) => {
      if (
        labelNode.data.errorType ||
        labelNode.data.labelType !== "paired_opening"
      ) {
        return;
      }
      const nestedOpenLabelNodes: any[] = [];
      for (let i = index + 1; i < (parent?.children.length ?? 0); i += 1) {
        const possibleMatch = parent?.children[i] as LabelNode | undefined;
        if (possibleMatch?.type !== "narrativeSchemaLabel") {
          continue;
        }
        if (
          possibleMatch.data.labelType === "paired_closing" &&
          possibleMatch.data.labelName === labelNode.data.labelName &&
          !possibleMatch.data.errorType &&
          !possibleMatch.data.pairedId
        ) {
          if (labelNode.data.id) {
            possibleMatch.data.pairedId = labelNode.data.id;
          }
          if (possibleMatch.data.id) {
            labelNode.data.pairedId = possibleMatch.data.id;
          }
          break;
        }

        if (possibleMatch.data.labelType === "paired_opening") {
          if (possibleMatch.data.pairedId) {
            nestedOpenLabelNodes.unshift(possibleMatch);
          } else {
            markLabelNodeAsErroneous(
              vFile,
              labelNode,
              "brokenNesting",
              "There is an issue with pairing labels with each other. Make sure all labels are correctly nested and spelled.",
            );
            break;
          }
        }

        if (possibleMatch.data.labelType === "paired_closing") {
          if (
            !nestedOpenLabelNodes.length ||
            nestedOpenLabelNodes[0].data.pairedId !== possibleMatch.data.id
          ) {
            markLabelNodeAsErroneous(
              vFile,
              labelNode,
              "brokenNesting",
              "There is an issue with pairing labels with each other. Make sure all labels are correctly nested and spelled.",
            );
            break;
          } else {
            nestedOpenLabelNodes.shift();
          }
        }
      }
    },
    true /* reverse */,
  );
};
