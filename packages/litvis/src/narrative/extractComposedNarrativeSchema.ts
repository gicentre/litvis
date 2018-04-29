import * as _ from "lodash";
import { loadComposedNarrativeSchema } from "narrative-schema";
import * as vfile from "vfile";
import convertPseudoYamlAstLocToPosition from "../convertPseudoYamlAstLocToPosition";
import { LitvisDocument, LitvisNarrative } from "../types";

export default async (
  narrative: LitvisNarrative,
  filesInMemory: Array<vfile.VFile<{}>> = [],
): Promise<void> => {
  _.forEach(narrative.documents, (document: LitvisDocument, fileIndex) => {
    const narrativeSchemas =
      document.data.litvisNarrativeSchemaPseudoAstNodesWithPaths;
    if (fileIndex !== 0 && _.isArray(narrativeSchemas)) {
      document.message(
        `‘narrative-schemas’ key in frontmatter is only allowed in a root document (the one that does not have ‘follows’). Value ignored.`,
        document.data.litvisNarrativeSchemaPseudoAstRootNode &&
          convertPseudoYamlAstLocToPosition(
            document.data.litvisNarrativeSchemaPseudoAstRootNode,
          ),
        "litvis:narrative-schemas",
      );
      return;
    }
  });
  narrative.composedNarrativeSchema = await loadComposedNarrativeSchema(
    narrative.documents[0].data.litvisNarrativeSchemaPseudoAstNodesWithPaths,
    [narrative.documents[0]],
    [],
    filesInMemory,
  );
};
