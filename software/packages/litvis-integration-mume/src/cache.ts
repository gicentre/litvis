import { initCache } from "litvis";
import * as LRU from "lru-cache";
import { LitvisEnhancerCache } from "./types";

export async function initLitvisEnhancerCache(): Promise<LitvisEnhancerCache> {
  return {
    litvisCache: initCache(),
    elmValueByStringRepresentation: LRU(100),
    successfulRenders: LRU(50),
  };
}
