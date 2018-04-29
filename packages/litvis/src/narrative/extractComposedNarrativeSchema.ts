import { getPosition } from "data-with-position";
import * as _ from "lodash";
import { loadComposedNarrativeSchema } from "narrative-schema";
import * as vfile from "vfile";
import { LitvisDocument, LitvisNarrative } from "../types";

export default async (
  narrative: LitvisNarrative,
  filesInMemory: Array<vfile.VFile<{}>> = [],
): Promise<void> => {
  _.forEach(narrative.documents, (document: LitvisDocument, fileIndex) => {
    const narrativeSchemasWithPosition =
      document.data.litvisNarrativeSchemasWithPosition;
    if (fileIndex !== 0 && narrativeSchemasWithPosition) {
      document.message(
        `‘narrative-schemas’ key in frontmatter is only allowed in a root document (the one that does not have ‘follows’). Value ignored.`,
        getPosition(narrativeSchemasWithPosition),
        "litvis:narrative-schemas",
      );
      return;
    }
  });
  narrative.composedNarrativeSchema = await loadComposedNarrativeSchema(
    narrative.documents[0].data.litvisNarrativeSchemasWithPosition,
    [narrative.documents[0]],
    [],
    filesInMemory,
  );
};
