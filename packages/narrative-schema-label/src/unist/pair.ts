// tslint:disable-next-line:no-implicit-dependencies
import { Parent } from "unist";
import visit from "unist-util-visit";
import { VFile } from "vfile";
import { LabelErrorType, LabelNode, LabelType } from "../types";
import { markLabelNodeAsErroneous } from "../utils";

export default () => (ast, vFile: VFile) => {
  return visit<LabelNode>(
    ast,
    "narrativeSchemaLabel",
    (labelNode, index, parent: Parent) => {
      if (
        labelNode.data.errorType ||
        labelNode.data.labelType !== LabelType.PAIRED_OPENING
      ) {
        return;
      }
      const nestedOpenLabelNodes: any[] = [];
      for (let i = index + 1; i < parent.children.length; i += 1) {
        const possibleMatch = parent.children[i] as LabelNode;
        if (possibleMatch.type !== "narrativeSchemaLabel") {
          continue;
        }
        if (
          possibleMatch.data.labelType === LabelType.PAIRED_CLOSING &&
          possibleMatch.data.labelName === labelNode.data.labelName &&
          !possibleMatch.data.errorType &&
          !possibleMatch.data.pairedId
        ) {
          possibleMatch.data.pairedId = labelNode.data.id;
          labelNode.data.pairedId = possibleMatch.data.id;
          break;
        }

        if (possibleMatch.data.labelType === LabelType.PAIRED_OPENING) {
          if (possibleMatch.data.pairedId) {
            nestedOpenLabelNodes.unshift(possibleMatch);
          } else {
            markLabelNodeAsErroneous(
              vFile,
              labelNode,
              LabelErrorType.BROKEN_NESTING,
              "There is an issue with pairing labels with each other. Make sure all labels are correctly nested and spelled.",
            );
            break;
          }
        }

        if (possibleMatch.data.labelType === LabelType.PAIRED_CLOSING) {
          if (
            !nestedOpenLabelNodes.length ||
            nestedOpenLabelNodes[0].data.pairedId !== possibleMatch.data.id
          ) {
            markLabelNodeAsErroneous(
              vFile,
              labelNode,
              LabelErrorType.BROKEN_NESTING,
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
