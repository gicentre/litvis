import { LitvisNarrative } from "litvis";

import { LitvisEnhancerCache } from "../types";
import enhanceWithLitvisLiterateElm from "./literateElm";
import enhanceWithLitvisNarrativeSchemas from "./narrativeSchemas";
import enhanceWithLitvisVegaBlockKeywords from "./vegaBlockKeywords";

// export * from "../types";

export default async function enhance(
  processedNarrative: LitvisNarrative,
  $: CheerioStatic,
  cache: LitvisEnhancerCache,
  parseMD: any,
) {
  await enhanceWithLitvisNarrativeSchemas($, processedNarrative, cache);
  await enhanceWithLitvisLiterateElm($, processedNarrative, cache, parseMD);
  await enhanceWithLitvisVegaBlockKeywords($, processedNarrative, cache);
}
