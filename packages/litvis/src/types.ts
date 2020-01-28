import { DataWithPosition } from "data-with-position";
import { EnvironmentSpec, ProgramResultStatus } from "literate-elm";
import { ComposedNarrativeSchema } from "narrative-schema";

// tslint:disable-next-line:no-implicit-dependencies
import { Node, Parent, Position } from "unist";
import { VFile } from "vfile";

export type ProcessedLitvisContextStatus = ProgramResultStatus;

export type OutputFormat =
  /** raw */
  | "r"
  /** json */
  | "j"
  /** markdown */
  | "m"
  /** visual */
  | "v";

export type BlockOutputFormat =
  | OutputFormat
  /** literate */
  | "l";

export interface AttributeDerivatives {
  contextName: string;
  outputFormats: BlockOutputFormat[];
  outputExpressionsByFormat: { [TKey in OutputFormat]?: string[] };
  interactive?: boolean;
  archive?: boolean;  
  id?: string;
  follows?: string;
}

export interface LitvisDocument extends VFile {
  data: {
    root: Parent;
    litvisFollowsPath?: string;
    litvisFollowsPosition?: Position;
    litvisElmDependencyVersions?: { [packageName: string]: string | false };
    litvisElmDependencyPositions?: { [packageName: string]: Position };
    litvisElmSourceDirectoryPaths?: string[];
    litvisElmSourceDirectoryPositions?: Position[];
    litvisNarrativeSchemasWithPosition?: DataWithPosition;
    renderedHtml?: string;
  };
}

export interface LitvisNarrative {
  documents: LitvisDocument[];
  elmEnvironmentSpecForLastFile?: EnvironmentSpec;
  contexts?: ProcessedLitvisContext[];
  composedNarrativeSchema?: ComposedNarrativeSchema;
  combinedAst?: Parent;
}

export interface SucceededLitvisContext {
  name: string;
  status: ProcessedLitvisContextStatus & "succeeded";
  evaluatedOutputExpressions: EvaluatedOutputExpression[];
  debugLog: string[];
}

export interface FailedLitvisContext {
  name: string;
  status: ProcessedLitvisContextStatus & "failed";
}

export type ProcessedLitvisContext =
  | SucceededLitvisContext
  | FailedLitvisContext;

export interface CodeBlock extends Node {
  lang?: string;
  value: string;
  data: {
    info?: string;
    litvisAttributeDerivatives?: AttributeDerivatives;
    visitedByExtractOutputItems?: true;
  };
}

export interface LitvisCodeBlock extends CodeBlock {
  data: {
    litvisAttributeDerivatives: AttributeDerivatives;
  };
}

export interface TripleHatReferenceNode extends Node {
  type: "tripleHatReference";
  data: {
    info?: string;
    litvisAttributeDerivatives?: AttributeDerivatives;
  };
}

export interface OutputExpression extends Node {
  type: string;
  data: {
    text: string;
    outputFormat: OutputFormat;
    contextName: string;
  };
}

export interface EvaluatedOutputExpression extends Node {
  type: string;
  data: {
    text: string;
    outputFormat: OutputFormat;
    contextName: string;
    value: any;
    valueStringRepresentation: string;
  };
}

export interface Cache {
  literateElmDirectory: string;
}

export interface CacheOptions {
  literateElmDirectory?: string;
}
