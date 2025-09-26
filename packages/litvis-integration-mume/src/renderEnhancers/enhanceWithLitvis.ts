import { LitvisNarrative } from "litvis";

import { LitvisEnhancerCache } from "../types";
import { enhanceWithLitvisLiterateElm } from "./enhanceWithLitvisLiterateElm";
import { enhanceWithLitvisNarrativeSchemas } from "./enhanceWithLitvisNarrativeSchemas";
import { enhanceWithLitvisVegaBlockKeywords } from "./enhanceWithLitvisVegaBlockKeywords";
import { ParseMd } from "./helpers";

export const enhanceWithLitvis = async (
  processedNarrative: LitvisNarrative,
  $: CheerioStatic,
  cache: LitvisEnhancerCache,
  parseMd: ParseMd,
): Promise<void> => {
  await enhanceWithLitvisNarrativeSchemas($, processedNarrative, cache);
  await enhanceWithLitvisLiterateElm($, processedNarrative, cache, parseMd);
  await enhanceWithLitvisVegaBlockKeywords($, processedNarrative, cache);
};
