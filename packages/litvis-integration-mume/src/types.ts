import LRU from "lru-cache";

import { Cache as LitvisCache } from "litvis";

export interface LitvisEnhancerCache {
  litvisCache: LitvisCache;
  successfulRenders: LRU<string, string>;
}

export interface LitvisEnhancerCacheInitOptions {
  mumeWorkingDirectory: string;
}
