import { Text } from "unist";
import { NodeWithPosition } from "vfile";
import { AttributeDerivatives, OutputFormat } from "./attribute-derivatives";
import { Cache } from "./cache";
import { LitvisDocument } from "./document";
import { ProgramResultStatus } from "./elm";
import {
  extractComposedNarrativeSchema,
  extractElmEnvironmentSpec,
  loadLitvisNarrative,
  processElmContexts,
  processNarrativeSchemaLabels,
} from "./narrative";
import { LitvisNarrative } from "./narrative";

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
