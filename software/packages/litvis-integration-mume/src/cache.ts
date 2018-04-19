import { initLitvisCache } from "litvis";
import * as LRU from "lru-cache";
import { LitvisEnhancerCache } from "./types";

export async function initLitvisEnhancerCache(): Promise<LitvisEnhancerCache> {
  return {
    litvisCache: initLitvisCache(),
    elmValueByStringRepresentation: LRU(100),
    successfulRenders: LRU(50),
  };
}
