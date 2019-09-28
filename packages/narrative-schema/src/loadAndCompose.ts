import { DataWithPosition } from "data-with-position";
import { ComposedNarrativeSchema } from "narrative-schema-common";
import { VFile } from "vfile";
import compose from "./compose";
import load from "./load";

export default async <Document extends VFile>(
  dependenciesWithPosition: DataWithPosition,
  parent: Document,
  filesInMemory: VFile[],
): Promise<ComposedNarrativeSchema> => {
  const narrativeSchemas = await load(
    dependenciesWithPosition,
    [parent],
    filesInMemory,
    [],
  );

  return compose(narrativeSchemas);
};
