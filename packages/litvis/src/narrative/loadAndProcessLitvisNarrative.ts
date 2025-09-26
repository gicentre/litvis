import { VFile } from "vfile";

import { Cache, LitvisNarrative } from "../types";
import { applySchemaToLabels } from "./applySchemaToLabels";
import { extractComposedNarrativeSchema } from "./extractComposedNarrativeSchema";
import { extractElmEnvironmentSpec } from "./extractElmEnvironmentSpec";
import { loadLitvisNarrative } from "./loadLitvisNarrative";
import { processElmContexts } from "./processElmContexts";

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
