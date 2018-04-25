import { Cache } from "./types";

export function initCache(): Cache {
  return {
    literateElmDirectory: "/tmp/literate-elm",
  };
}
