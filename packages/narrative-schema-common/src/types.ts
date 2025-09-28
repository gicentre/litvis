import type { DataWithPosition } from "data-with-position";
import type { VFile } from "vfile";

export interface EntityDefinition {
  data: any;
  dataWithPosition: DataWithPosition;
  dataPath: Array<number | string>;
}

export interface EntityDefinitionWithOrigin extends EntityDefinition {
  origin: NarrativeSchema;
}

export type ParentDocument = VFile;

export interface NarrativeSchemaData {
  labels: EntityDefinition[];
  rules: EntityDefinition[];
  styling: EntityDefinition[];
}

export interface NarrativeSchema extends VFile {
  data: NarrativeSchemaData;
  parents: Array<NarrativeSchema | ParentDocument>;
}

export interface ComposedNarrativeSchema {
  components: NarrativeSchema[];
  labels: EntityDefinitionWithOrigin[];
  rules: EntityDefinitionWithOrigin[];
  styling: EntityDefinitionWithOrigin[];
  labelByName: { [name: string]: EntityDefinitionWithOrigin };
}
