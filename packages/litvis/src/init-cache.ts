import path from "path";
import tempDir from "temp-dir";

import type { Cache, CacheOptions } from "./types";

export const initCache = ({
  literateElmDirectory,
}: CacheOptions = {}): Cache => {
  return {
    literateElmDirectory:
      literateElmDirectory || path.resolve(tempDir, "literate-elm"),
  };
};
