import * as _ from "lodash";

import {
  ComposedNarrativeSchema,
  EntityDefinitionWithOrigin,
  NarrativeSchema,
} from "narrative-schema-common";
import { composeDefinitions as composeLabelDefinitions } from "narrative-schema-label";
import { composeDefinitions as composeRuleDefinitions } from "narrative-schema-rule";
import { composeDefinitions as composeStylingDefinitions } from "narrative-schema-styling";

// @ts-ignore
import { NarrativeSchemaData } from "narrative-schema-common";
// @ts-ignore
import { VFileBase } from "vfile";

const compose = async (
  narrativeSchemas: NarrativeSchema[],
): Promise<ComposedNarrativeSchema> => {
  let labels: EntityDefinitionWithOrigin[] = [];
  let rules: EntityDefinitionWithOrigin[] = [];
  let styling: EntityDefinitionWithOrigin[] = [];

  for (const narrativeSchema of narrativeSchemas) {
    labels = composeLabelDefinitions(labels, narrativeSchema);
    rules = composeRuleDefinitions(rules, narrativeSchema);
    styling = composeStylingDefinitions(rules, narrativeSchema);
  }

  return {
    components: narrativeSchemas,
    labels,
    rules,
    styling,
    labelsByName: _.keyBy(labels, ["data", "name"]),
  };
};

export default compose;
