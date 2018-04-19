import { LabelType, LabelFence } from "./types";

export const deriveType = (start: string, end: string): LabelType => {
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
