import _ from "lodash";
import { applySchemaToLabels as doApplySchemaToLabels } from "narrative-schema-label";
import unified from "unified";
import type { Parent } from "unist";

import type { LitvisNarrative } from "../types";

export const applySchemaToLabels = async (
  narrative: LitvisNarrative,
): Promise<void> => {
  const lastFile = _.last(narrative.documents);
  if (!lastFile || !narrative.composedNarrativeSchema) {
    return;
  }

  // extract label html
  const labelPlugin = doApplySchemaToLabels(narrative.composedNarrativeSchema);
  for (const file of narrative.documents) {
    const engine = unified().use(labelPlugin);
    await engine.run(file.data.root, file);
  }

  const combinedAst: Parent = {
    type: "parent",
    children: _.map(narrative.documents, (file) => file.data.root),
  };

  narrative.combinedAst = combinedAst;
};
