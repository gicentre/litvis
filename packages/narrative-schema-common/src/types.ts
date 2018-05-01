import { DataWithPosition } from "data-with-position";
import { VFileBase } from "vfile";

export { VFileBase } from "vfile";

export interface EntityDefinition {
  data: any;
  dataWithPosition: DataWithPosition;
  dataPath: Array<number | string>;
}

export interface EntityDefinitionWithOrigin extends EntityDefinition {
  origin: NarrativeSchema;
}

export type ParentDocument = VFileBase<any>;

export interface NarrativeSchemaData {
  labels: EntityDefinition[];
  rules: EntityDefinition[];
  styling: EntityDefinition[];
}

export type NarrativeSchema = VFileBase<{
  data: NarrativeSchemaData;
  parents: Array<NarrativeSchema | ParentDocument>;
}>;

export interface ComposedNarrativeSchema {
  components: NarrativeSchema[];
  labels: EntityDefinitionWithOrigin[];
  rules: EntityDefinitionWithOrigin[];
  styling: EntityDefinitionWithOrigin[];
  labelByName: { [name: string]: EntityDefinitionWithOrigin };
}
