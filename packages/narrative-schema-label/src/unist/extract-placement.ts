import type { Node, Parent } from "unist";
import visit from "unist-util-visit-parents";
import type { VFile } from "vfile";

import type { LabelNode } from "../types";

export const extractPlacement = () => (ast: Node, vFile: VFile) => {
  return visit<LabelNode>(
    ast,
    "narrativeSchemaLabel",
    // @ts-expect-error -- TODO: investigate type mismatch
    (labelNode, parents: Parent[]) => {
      if (labelNode.data.errorType) {
        labelNode.data.placement = "na";

        return;
      }
      const parent = parents[parents.length - 1];
      const grandparent = parents[parents.length - 2];
      if (parent?.type === "paragraph" && parent.children.length === 1) {
        const parentIndex = grandparent?.children.indexOf(parent);
        // @ts-expect-error -- TODO: investigate type mismatch
        grandparent.children[parentIndex] = labelNode;
        labelNode.data.placement = "block";
      } else {
        labelNode.data.placement = "inline";
      }
    },
  );
};
