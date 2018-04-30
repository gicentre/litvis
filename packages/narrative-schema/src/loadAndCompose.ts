import { DataWithPosition } from "data-with-position";
import { ComposedNarrativeSchema } from "narrative-schema-common";
import * as vfile from "vfile";
import compose from "./compose";
import load from "./load";

export default async <Document extends vfile.VFileBase<any>>(
  dependenciesWithPosition: DataWithPosition,
  parent: Document,
  filesInMemory: Array<vfile.VFileBase<{}>>,
): Promise<ComposedNarrativeSchema> => {
  const narrativeSchemas = await load(
    dependenciesWithPosition,
    [parent],
    filesInMemory,
    [],
  );

  return compose(narrativeSchemas);
};
