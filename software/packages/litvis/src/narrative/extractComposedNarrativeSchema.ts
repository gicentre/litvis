import * as _ from "lodash";
import { loadComposedNarrativeSchema } from "narrative-schema";
import * as vfile from "vfile";
import { LitvisDocument, LitvisNarrative } from "../types";

export default async (
  narrative: LitvisNarrative,
  filesInMemory: Array<vfile.VFile<{}>> = [],
): Promise<void> => {
  _.forEach(narrative.documents, (file: LitvisDocument, fileIndex) => {
    const narrativeSchemas = file.data.litvisNarrativeSchemas;
    if (fileIndex !== 0 && _.isArray(narrativeSchemas)) {
      file.message(
        `‘narrative-schemas’ key in frontmatter is only allowed in a root document (the one that does not have ‘follows’). Value ignored.`,
        null,
        "litvis:narrative-schemas",
      );
      return;
    }
  });
  narrative.composedNarrativeSchema = await loadComposedNarrativeSchema(
    narrative.documents[0].data.litvisNarrativeSchemas,
    [narrative.documents[0]],
    [],
    filesInMemory,
  );
};
