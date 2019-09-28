import hash from "object-hash";
import { VFile } from "vfile";
import { LabelErrorType, LabelFence, LabelType } from "./types";

export const getLabelIdPrefix = (vFile: VFile) =>
  hash(vFile.path).substring(0, 8);

export const deriveLabelType = (start: string, end: string): LabelType => {
  if (start === LabelFence.START && end === LabelFence.END) {
    return LabelType.SINGLE;
  }
  if (start === LabelFence.START && end === LabelFence.END_OPENING) {
    return LabelType.PAIRED_OPENING;
  }
  if (start === LabelFence.START_CLOSING && end === LabelFence.END) {
    return LabelType.PAIRED_CLOSING;
  }
  return LabelType.INVALID;
};

export const markLabelNodeAsErroneous = (
  vFile: VFile,
  labelNode,
  errorType: LabelErrorType,
  errorCaption: string,
) => {
  labelNode.data.errorType = errorType;
  labelNode.data.errorCaption = errorCaption;
  vFile.message(errorCaption, labelNode, "litvis:narrative-schema-label");
};

export const isValidLabelName = (name: string): boolean =>
  !!name.match(/^[a-zA-Z][a-zA-Z0-9_]*$/);
