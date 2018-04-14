import { Text } from "unist";
import { NodeWithPosition, VFile } from "vfile";

export interface ElmSymbol {
  name: string;
  type?: string;
}

export interface Dependencies {
  [key: string]: string;
}

export interface EnvironmentSpec {
  /**
   * Elm package dependencies as name=>version pairs
   *
   * Acceptable version formats:
   * - MAJOR
   * - MAJOR.MINOR
   * - MAJOR.MINOR.PATCH
   * - "latest"
   */
  dependencies: Dependencies;

  /**
   * absolute paths to source directories
   *
   * This is an advanced feature, which is only needed in literate-elm programs
   * to test local development copies of Elm packages
   */
  sourceDirectories: string[];
}

export enum EnvironmentStatus {
  INITIALIZING = "initializing",
  READY = "ready",
  ERROR = "error",
}

export interface EnvironmentMetadata {
  version: string;
  status: EnvironmentStatus;
  createdAt: number;
  usedAt: number;
  errorMessage?: string;
}

export interface Environment {
  metadata: EnvironmentMetadata;
  spec: EnvironmentSpec;
  workingDirectory: string;
}

export interface Program {
  environment: Environment;
  codeBlocks: CodeBlockWithFile[];
  outputExpressions: OutputExpressionWithFile[];
}

export enum ProgramResultStatus {
  SUCCESS = "success",
  ERROR = "error",
}

export interface ProgramResult {
  program: Program;
  status: ProgramResultStatus;
  evaluatedOutputExpressions: OutputExpressionWithFile[];
}

export interface CodeBlockWithFile extends Text {
  data: {
    file: VFile<any>;
  };
}

export interface OutputExpression extends NodeWithPosition {
  data: {
    text: string;
    stringRepresentation?: string;
    // value?: any;
  };
}

export interface OutputExpressionWithFile extends OutputExpression {
  data: {
    file: VFile<any>;
    text: string;
    stringRepresentation?: string;
    // value?: any;
  };
}

export import ProcessedLitvisContextStatus = ProgramResultStatus;

export interface ProcessedLitvisContext {
  name: string;
  status: ProcessedLitvisContextStatus;
  evaluatedOutputExpressions: OutputExpression[];
}
