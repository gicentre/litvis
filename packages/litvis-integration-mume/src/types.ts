import type { Cache as LitvisCache } from "litvis";
import type { LRUCache } from "lru-cache";

export interface LitvisEnhancerCache {
  litvisCache: LitvisCache;
  successfulRenders: LRUCache<string, string>;
}

export interface LitvisEnhancerCacheInitOptions {
  mumeWorkingDirectory: string;
}
