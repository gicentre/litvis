import { VFile } from "vfile";

import { LitvisNarrative } from "../types";

export default (narrative: LitvisNarrative): VFile[] => {
  const result: VFile[] = [...narrative.documents];
  if (narrative.composedNarrativeSchema) {
    result.push(...narrative.composedNarrativeSchema.components);
  }
  return result;
};
