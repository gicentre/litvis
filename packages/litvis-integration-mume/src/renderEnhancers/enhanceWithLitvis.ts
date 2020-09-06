import { LitvisNarrative } from "litvis";

import { LitvisEnhancerCache } from "../types";
import { enhanceWithLitvisLiterateElm } from "./enhanceWithLitvisLiterateElm";
import { enhanceWithLitvisNarrativeSchemas } from "./enhanceWithLitvisNarrativeSchemas";
import { enhanceWithLitvisVegaBlockKeywords } from "./enhanceWithLitvisVegaBlockKeywords";

export const enhanceWithLitvis = async (
  processedNarrative: LitvisNarrative,
  $: CheerioStatic,
  cache: LitvisEnhancerCache,
  parseMD: any,
): Promise<void> => {
  await enhanceWithLitvisNarrativeSchemas($, processedNarrative, cache);
  await enhanceWithLitvisLiterateElm($, processedNarrative, cache, parseMD);
  await enhanceWithLitvisVegaBlockKeywords($, processedNarrative, cache);
};
