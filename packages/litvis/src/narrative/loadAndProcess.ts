import { Cache, LitvisDocument, LitvisNarrative } from "../types";
import applySchemaToLabels from "./applySchemaToLabels";
import extractComposedNarrativeSchema from "./extractComposedNarrativeSchema";
import extractElmEnvironmentSpec from "./extractElmEnvironmentSpec";
import load from "./load";
import processElmContexts from "./processElmContexts";

export default async (
  filePath,
  filesInMemory: LitvisDocument[] = [],
  cache: Cache,
): Promise<LitvisNarrative> => {
  const narrative = await load(filePath, filesInMemory, cache);
  await extractElmEnvironmentSpec(narrative);
  await extractComposedNarrativeSchema(narrative);
  await processElmContexts(narrative, cache);
  await applySchemaToLabels(narrative);
  return narrative;
};
