import visit from "unist-util-visit";
import { VFile } from "vfile";
import { LabelErrorType, LabelPlacement, LabelType } from "../types";
import { markLabelNodeAsErroneous } from "../utils";

export default () => (ast, vFile: VFile<any>) => {
  return visit(ast, "narrativeSchemaLabel", (labelNode, index, parent) => {
    if (
      labelNode.data.errorType ||
      (labelNode.data.labelType !== LabelType.PAIRED_OPENING &&
        labelNode.data.labelType !== LabelType.PAIRED_CLOSING)
    ) {
      return;
    }
    if (!labelNode.data.pairedId) {
      const caption = `Could not find a matching ${
        labelNode.data.labelType === LabelType.PAIRED_OPENING
          ? "closing"
          : "opening"
      } label for ${labelNode.data.labelName}. ${
        labelNode.data.placement === LabelPlacement.BLOCK
          ? "This label is placed as block, so the match cannot be surrounded by inline elements and must be padded by empty lines."
          : "This label is inline, so the match must be located within the same paragraph and in the same inline element (if any)."
      }`;

      markLabelNodeAsErroneous(
        vFile,
        labelNode,
        LabelErrorType.BROKEN_PAIR,
        caption,
      );
    }
  });
};
