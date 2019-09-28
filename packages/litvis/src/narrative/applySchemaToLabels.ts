import _ from "lodash";
import { applySchemaToLabels } from "narrative-schema-label";
import unified from "unified";
// tslint:disable-next-line:no-implicit-dependencies
import { Parent } from "unist";
import { LitvisNarrative } from "../types";

export default async (narrative: LitvisNarrative): Promise<void> => {
  const lastFile = _.last(narrative.documents);
  if (!lastFile || !narrative.composedNarrativeSchema) {
    return;
  }

  // extract label html
  const labelPlugin = applySchemaToLabels(narrative.composedNarrativeSchema);
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
