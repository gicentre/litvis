import * as path from "path";
import * as tempDir from "temp-dir";
import { Cache, CacheOptions } from "./types";

export function initCache({ literateElmDirectory }: CacheOptions = {}): Cache {
  return {
    literateElmDirectory:
      literateElmDirectory || path.resolve(tempDir, "literate-elm"),
  };
}
