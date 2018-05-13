import { Cache } from "lru-cache";

// import { Cache as LitvisCache } from "litvis";

export interface LitvisEnhancerCache {
  // litvisCache: LitvisCache;
  litvisCache: any;
  successfulRenders: Cache<string, string>;
}

export interface LitvisEnhancerCacheInitOptions {
  mumeWorkingDirectory: string;
}
