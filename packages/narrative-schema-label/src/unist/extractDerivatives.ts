import { parse as parseBlockInfo } from "block-info";
import _ from "lodash";
import visit from "unist-util-visit";
import { VFile } from "vfile";
import { LabelErrorType, LabelType } from "../types";
import { getLabelIdPrefix, markLabelNodeAsErroneous } from "../utils";

export default () => (ast, vFile: VFile<any>) => {
  const idPrefix = getLabelIdPrefix(vFile);
  let idIndex = 0;
  return visit(ast, "narrativeSchemaLabel", (labelNode) => {
    const parsedInfo = parseBlockInfo(labelNode.data.info);
    const labelName = parsedInfo.language;
    const labelType = labelNode.data.labelType;
    const labelAttributes = parsedInfo.attributes;

    labelNode.labelName = labelName;
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
        LabelErrorType.BLANK,
        `Label cannot be blank.`,
      );
      return;
    }
    if (labelType === LabelType.INVALID) {
      markLabelNodeAsErroneous(
        vFile,
        labelNode,
        LabelErrorType.INVALID,
        `Label ${labelName} is neither single nor paired, please change the endings.`,
      );
      return;
    }

    if (labelType === LabelType.PAIRED_CLOSING && !_.isEmpty(labelAttributes)) {
      markLabelNodeAsErroneous(
        vFile,
        labelNode,
        LabelErrorType.CLOSING_WITH_ATTRIBUTES,
        `A closing paired label cannot have attributes.`,
      );
      return;
    }
  });
};
