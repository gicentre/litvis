import { initCache } from "litvis";
import LRU from "lru-cache";
import path from "path";
import { LitvisEnhancerCache } from "./types";

export async function initLitvisEnhancerCache({
  mumeWorkingDirectory,
}): Promise<LitvisEnhancerCache> {
  return {
    litvisCache: initCache({
      literateElmDirectory: path.resolve(mumeWorkingDirectory, "literate-elm"),
    }),
    successfulRenders: LRU(50),
  };
}
