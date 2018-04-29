import {
  LabelDefinition,
  LabelDefinitionWithOrigin,
} from "narrative-schema-label";
import {
  RuleDefinition,
  RuleDefinitionWithOrigin,
} from "narrative-schema-rule";
import {
  StylingDefinition,
  StylingDefinitionWithOrigin,
} from "narrative-schema-styling";
import { VFileBase } from "vfile";

export interface NarrativeSchemaData {
  labels: LabelDefinition[];
  rules: RuleDefinition[];
  styling: StylingDefinition[];
}

export type NarrativeSchema<Document> = VFileBase<{
  data: NarrativeSchemaData;
  parents: Array<NarrativeSchema<Document> | Document>;
}>;

export interface ComposedNarrativeSchema<Document> {
  components: Array<NarrativeSchema<Document>>;
  labels: LabelDefinitionWithOrigin[];
  rules: RuleDefinitionWithOrigin[];
  styling: StylingDefinitionWithOrigin[];
}
