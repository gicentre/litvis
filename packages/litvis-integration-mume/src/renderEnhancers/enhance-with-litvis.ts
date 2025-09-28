import type { LitvisNarrative } from "litvis";

import type { LitvisEnhancerCache } from "../types";
import { enhanceWithLitvisLiterateElm } from "./enhance-with-litvis-literate-elm";
import { enhanceWithLitvisNarrativeSchemas } from "./enhance-with-litvis-narrative-schemas";
import { enhanceWithLitvisVegaBlockKeywords } from "./enhance-with-litvis-vega-block-keywords";
import type { ParseMd } from "./helpers";

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
