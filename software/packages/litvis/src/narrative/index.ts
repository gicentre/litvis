import { ProcessedLitvisContext } from "..";
import { LitvisDocument } from "../document";
import { EnvironmentSpec } from "../elm";
import { ComposedNarrativeSchema } from "../narrative-schema";

export interface LitvisNarrative {
  files: LitvisDocument[];
  elmEnvironmentSpecForLastFile?: EnvironmentSpec;
  contexts?: ProcessedLitvisContext[];
  composedNarrativeSchema?: ComposedNarrativeSchema;
}

export {
  default as extractComposedNarrativeSchema,
} from "./extract-composed-narrative-schema";
export {
  default as extractElmEnvironmentSpec,
} from "./extract-elm-environment-spec";
export { default as loadLitvisNarrative } from "./load";
export { default as processElmContexts } from "./process-elm-contexts";
export {
  default as processNarrativeSchemaLabels,
} from "./process-narrative-schema-labels";
