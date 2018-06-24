import * as visit from "unist-util-visit-parents";
import { VFile } from "vfile";
import { LabelPlacement } from "../types";

export default () => (ast, vFile: VFile<any>) => {
  return visit(ast, "narrativeSchemaLabel", (labelNode, parents) => {
    if (labelNode.data.errorType) {
      labelNode.data.placement = LabelPlacement.NA;
      return;
    }
    const parent = parents[parents.length - 1];
    const grandparent = parents[parents.length - 2];
    if (parent.type === "paragraph" && parent.children.length === 1) {
      const parentIndex = grandparent.children.indexOf(parent);
      grandparent.children[parentIndex] = labelNode;
      labelNode.data.placement = LabelPlacement.BLOCK;
    } else {
      labelNode.data.placement = LabelPlacement.INLINE;
    }
  });
};
