import { VFile } from "vfile";

export type Document = VFile<any>;

export interface LabelKind {
  htmlTemplate: string;
}

export interface LabelDefinition {
  name: string;
  single?: LabelKind;
  paired?: LabelKind;
}

export interface LabelDefinitionWithOrigin extends LabelDefinition {
  origin: NarrativeSchema;
}

export interface RuleDefinition {
  description: string;
  selector: {
    label: string;
  };
  minimumOccurrences?: number;
  maximumOccurrences?: number;
}
export interface RuleDefinitionWithOrigin extends RuleDefinition {
  origin: NarrativeSchema;
}

export interface CssWithOrigin {
  content: string;
  origin: NarrativeSchema;
}

export interface NarrativeSchemaData {
  dependencies: string[];
  labels: LabelDefinition[];
  rules: RuleDefinition[];
  css: string;
}

export type NarrativeSchema = VFile<{
  data: NarrativeSchemaData;
  dependencyOf?: NarrativeSchema | Document;
}>;

export interface ComposedNarrativeSchema {
  components: NarrativeSchema[];
  labels: LabelDefinitionWithOrigin[];
  rules: RuleDefinitionWithOrigin[];
  css: CssWithOrigin[];
}
