import { Cache as LitvisCache } from "litvis";
import LRU from "lru-cache";

export interface LitvisEnhancerCache {
  litvisCache: LitvisCache;
  successfulRenders: LRU<string, string>;
}

export interface LitvisEnhancerCacheInitOptions {
  mumeWorkingDirectory: string;
}
