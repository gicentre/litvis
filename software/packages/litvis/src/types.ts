import { EnvironmentSpec, ProgramResultStatus } from "literate-elm";
import { ComposedNarrativeSchema } from "narrative-schema";
// tslint:disable-next-line:no-implicit-dependencies
import { Node, Text } from "unist";
import { VFile } from "vfile";

// tslint:disable-next-line:no-implicit-dependencies
export { Node } from "unist";
export { VFileBase } from "vfile";
export import ProcessedLitvisContextStatus = ProgramResultStatus;

export enum OutputFormat {
  /** raw */
  R = "r",
  /** json */
  J = "j",
  /** visual */
  V = "v",
}

export enum BlockOutputFormat {
  // pending https://github.com/Microsoft/TypeScript/issues/17592
  // ...OutputFormat,

  /** raw */
  R = "r",
  /** json */
  J = "j",
  /** visual */
  V = "v",

  /** literate */
  L = "l",
}

export interface AttributeDerivatives {
  contextName: string;
  outputFormats: BlockOutputFormat[];
  outputExpressionsByFormat: { [TKey in OutputFormat]?: string[] };
  interactive?: boolean;
  id?: string;
  follows?: string;
}

export type LitvisDocument = VFile<{
  data: {
    root: Node;
    litvisFollows?: string;
    litvisElmDependencies?: { [packageName: string]: string | false };
    litvisElmSourceDirectories?: string[];
    litvisNarrativeSchemas?: string[];
    renderedHtml?: string;
  };
}>;

export interface LitvisNarrative {
  documents: LitvisDocument[];
  elmEnvironmentSpecForLastFile?: EnvironmentSpec;
  contexts?: ProcessedLitvisContext[];
  composedNarrativeSchema?: ComposedNarrativeSchema;
}

export interface SucceededLitvisContext {
  name: string;
  status: ProcessedLitvisContextStatus.SUCCEEDED;
  evaluatedOutputExpressions: EvaluatedOutputExpression[];
  debugLog: string;
}

export interface FailedLitvisContext {
  name: string;
  status: ProcessedLitvisContextStatus.FAILED;
}

export type ProcessedLitvisContext =
  | SucceededLitvisContext
  | FailedLitvisContext;

export interface CodeBlock extends Text {
  data: {
    litvisAttributeDerivatives: AttributeDerivatives;
  };
}

export interface OutputExpression extends Text {
  data: {
    text: string;
    outputFormat: OutputFormat;
    contextName: string;
  };
}

export interface EvaluatedOutputExpression extends Text {
  data: {
    text: string;
    outputFormat: OutputFormat;
    contextName: string;
    value: any;
    valueStringRepresentation: string;
  };
}

export interface Cache {
  a?: string;
  literateElmDirectory: string;
}
