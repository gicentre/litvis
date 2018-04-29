import { DataWithPosition } from "data-with-position";
import * as vfile from "vfile";
import compose from "./compose";
import load from "./load";

import { ComposedNarrativeSchema } from "./types";

export default async <Document extends vfile.VFileBase<any>>(
  dependenciesWithPosition: DataWithPosition,
  parent: Document,
  filesInMemory: Array<vfile.VFileBase<{}>>,
): Promise<ComposedNarrativeSchema<Document>> => {
  const narrativeSchemas = await load<Document>(
    dependenciesWithPosition,
    [parent],
    filesInMemory,
    [],
  );

  return compose<Document>(narrativeSchemas);
};
