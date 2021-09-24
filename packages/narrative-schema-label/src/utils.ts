import hash from "object-hash";
import { VFile } from "vfile";

import { LabelErrorType, LabelFence, LabelNode, LabelType } from "./types";

export const getLabelIdPrefix = (vFile: VFile) =>
  hash(vFile.path).substring(0, 8);

export const deriveLabelType = (start: string, end: string): LabelType => {
  if (start === LabelFence.START && end === LabelFence.END) {
    return "single";
  }
  if (start === LabelFence.START && end === LabelFence.END_OPENING) {
    return "paired_opening";
  }
  if (start === LabelFence.START_CLOSING && end === LabelFence.END) {
    return "paired_closing";
  }

  return "invalid";
};

export const markLabelNodeAsErroneous = (
  vFile: VFile,
  labelNode: LabelNode,
  errorType: LabelErrorType,
  errorCaption: string,
) => {
  labelNode.data.errorType = errorType;
  labelNode.data.errorCaption = errorCaption;
  vFile.message(errorCaption, labelNode, "litvis:narrative-schema-label");
};

export const isValidLabelName = (name: string): boolean =>
  !!name.match(/^[a-zA-Z][a-zA-Z0-9_]*$/);
