import * as path from "path";
import * as tempDir from "temp-dir";
import { Cache } from "./types";

export function initCache(): Cache {
  return {
    literateElmDirectory: path.resolve(tempDir, "literate-elm"),
  };
}
