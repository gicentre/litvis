import { VFileBase } from "vfile";
import { LitvisNarrative } from "../types";

export default (narrative: LitvisNarrative): Array<VFileBase<any>> => {
  const result: Array<VFileBase<any>> = [...narrative.documents];
  if (narrative.composedNarrativeSchema) {
    result.push(...narrative.composedNarrativeSchema.components);
  }
  return result;
};
