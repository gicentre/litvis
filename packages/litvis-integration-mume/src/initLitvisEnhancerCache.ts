import { initCache } from "litvis";
import LRU from "lru-cache";
import path from "path";

import type { LitvisEnhancerCache } from "./types";

export const initLitvisEnhancerCache = async ({
  mumeWorkingDirectory,
}: {
  mumeWorkingDirectory: string;
}): Promise<LitvisEnhancerCache> => {
  return {
    litvisCache: initCache({
      literateElmDirectory: path.resolve(mumeWorkingDirectory, "literate-elm"),
    }),
    successfulRenders: new LRU(50),
  };
};
