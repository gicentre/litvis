import { initCache } from "litvis";
import * as LRU from "lru-cache";
import { LitvisEnhancerCache } from "./types";

export async function initLitvisEnhancerCache(): Promise<LitvisEnhancerCache> {
  return {
    litvisCache: initCache(),
    successfulRenders: LRU(50),
  };
}
