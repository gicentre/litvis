import {
  extractComposedNarrativeSchema,
  extractElmEnvironmentSpec,
  loadLitvisNarrative,
  processElmContexts,
  processNarrativeSchemaLabels,
} from "./narrative";
import { Cache, LitvisDocument, LitvisNarrative } from "./types";
// @ts-ignore
import { Node, Position, VFileBase } from "./types";

export async function loadAndProcessLitvisNarrative(
  filePath,
  filesInMemory: LitvisDocument[] = [],
  cache: Cache,
): Promise<LitvisNarrative> {
  const narrative = await loadLitvisNarrative(filePath, filesInMemory, cache);
  await extractElmEnvironmentSpec(narrative);
  await extractComposedNarrativeSchema(narrative);
  await processElmContexts(narrative, cache);
  await processNarrativeSchemaLabels(narrative);
  return narrative;
}

export {
  extractAttributeDerivatives,
  resolveExpressions,
} from "./attributeDerivatives";
export { initCache } from "./cache";
export * from "./types";
