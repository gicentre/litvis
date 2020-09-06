import { Parent } from "unist";
import visit from "unist-util-visit-parents";
import { VFile } from "vfile";

import { LabelNode } from "../types";

export const extractPlacement = () => (ast, vFile: VFile) => {
  return visit<LabelNode>(
    ast,
    "narrativeSchemaLabel",
    (labelNode, parents: Parent[]) => {
      if (labelNode.data.errorType) {
        labelNode.data.placement = "na";
        return;
      }
      const parent = parents[parents.length - 1];
      const grandparent = parents[parents.length - 2];
      if (parent.type === "paragraph" && parent.children.length === 1) {
        const parentIndex = grandparent.children.indexOf(parent);
        grandparent.children[parentIndex] = labelNode;
        labelNode.data.placement = "block";
      } else {
        labelNode.data.placement = "inline";
      }
    },
  );
};
