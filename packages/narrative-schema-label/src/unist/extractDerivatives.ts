import { parseBlockInfo } from "block-info";
import _ from "lodash";
import { Node } from "unist";
import visit from "unist-util-visit";
import { VFile } from "vfile";

import { LabelNode } from "../types";
import { getLabelIdPrefix, markLabelNodeAsErroneous } from "../utils";

export const extractDerivatives = () => (ast: Node, vFile: VFile) => {
  const idPrefix = getLabelIdPrefix(vFile);
  let idIndex = 0;

  return visit<LabelNode>(ast, "narrativeSchemaLabel", (labelNode) => {
    const parsedInfo = parseBlockInfo(labelNode.data.info);
    const labelName = parsedInfo.language;
    const labelType = labelNode.data.labelType;
    const labelAttributes = parsedInfo.attributes;

    labelNode.data.labelName = labelName;
    labelNode.data.labelAttributes = labelAttributes;

    // id helps litvis-integration-mume match labels in uniast
    // with the ones it finds in markdown-it tree
    labelNode.data.id = `${idPrefix}-${idIndex}`;
    idIndex += 1;

    if (!labelName) {
      markLabelNodeAsErroneous(
        vFile,
        labelNode,
        "blank",
        `Label cannot be blank.`,
      );

      return;
    }
    if (labelType === "invalid") {
      markLabelNodeAsErroneous(
        vFile,
        labelNode,
        "invalid",
        `Label ${labelName} is neither single nor paired, please change the endings.`,
      );

      return;
    }

    if (labelType === "paired_closing" && !_.isEmpty(labelAttributes)) {
      markLabelNodeAsErroneous(
        vFile,
        labelNode,
        "closingWithAttributes",
        `A closing paired label cannot have attributes.`,
      );

      return;
    }
  });
};
