import type { DataWithPosition } from "data-with-position";
import type { ComposedNarrativeSchema } from "narrative-schema-common";
import type { VFile } from "vfile";

import { compose } from "./compose";
import { load } from "./load";

export const loadAndCompose = async <Document extends VFile>(
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
