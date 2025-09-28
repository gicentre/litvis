import type { VFile } from "vfile";

import type { Cache, LitvisNarrative } from "../types";
import { applySchemaToLabels } from "./apply-schema-to-labels";
import { extractComposedNarrativeSchema } from "./extract-composed-narrative-schema";
import { extractElmEnvironmentSpec } from "./extract-elm-environment-spec";
import { loadLitvisNarrative } from "./load-litvis-narrative";
import { processElmContexts } from "./process-elm-contexts";

export const loadAndProcessLitvisNarrative = async (
  filePath: string,
  filesInMemory: VFile[] = [],
  cache: Cache,
): Promise<LitvisNarrative> => {
  const narrative = await loadLitvisNarrative(filePath, filesInMemory, cache);
  await extractElmEnvironmentSpec(narrative);
  await extractComposedNarrativeSchema(narrative);
  await processElmContexts(narrative, cache);
  await applySchemaToLabels(narrative);

  return narrative;
};
