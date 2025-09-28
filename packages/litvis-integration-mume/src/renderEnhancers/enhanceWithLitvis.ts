import type { CheerioAPI } from "cheerio";
import type { LitvisNarrative } from "litvis";

import type { LitvisEnhancerCache } from "../types";
import { enhanceWithLitvisLiterateElm } from "./enhanceWithLitvisLiterateElm";
import { enhanceWithLitvisNarrativeSchemas } from "./enhanceWithLitvisNarrativeSchemas";
import { enhanceWithLitvisVegaBlockKeywords } from "./enhanceWithLitvisVegaBlockKeywords";
import type { ParseMd } from "./helpers";

export const enhanceWithLitvis = async (
  processedNarrative: LitvisNarrative,
  $: CheerioAPI,
  cache: LitvisEnhancerCache,
  parseMd: ParseMd,
): Promise<void> => {
  await enhanceWithLitvisNarrativeSchemas($, processedNarrative, cache);
  await enhanceWithLitvisLiterateElm($, processedNarrative, cache, parseMd);
  await enhanceWithLitvisVegaBlockKeywords($, processedNarrative, cache);
};
