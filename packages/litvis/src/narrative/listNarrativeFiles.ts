import type { VFile } from "vfile";

import type { LitvisNarrative } from "../types";

export const listNarrativeFiles = (narrative: LitvisNarrative): VFile[] => {
  const result: VFile[] = [...narrative.documents];
  if (narrative.composedNarrativeSchema) {
    result.push(...narrative.composedNarrativeSchema.components);
  }

  return result;
};
