import { BlockAttributes } from "block-attributes";
// tslint:disable-next-line:no-implicit-dependencies
import { Node } from "unist";

export enum LabelType {
  SINGLE = "single",
  PAIRED_OPENING = "paired_opening",
  PAIRED_CLOSING = "paired_closing",
  INVALID = "invalid",
}

export enum LabelKind {
  SINGLE = "single",
  PAIRED = "paired",
  INVALID = "invalid",
}

export enum LabelPlacement {
  INLINE = "inline",
  BLOCK = "block",
  NA = "na",
}

export enum LabelFence {
  START = "{(",
  END = ")}",
  START_CLOSING = "{|",
  END_OPENING = "|}",
}

export enum LabelErrorType {
  BLANK,
  INVALID,
  CLOSING_WITH_ATTRIBUTES,
  MISSING_DEFINITION,
  KIND_MISUSE,
  HTML_TEMPLATE_EXCEPTION,
  BROKEN_PAIR,
  BROKEN_NESTING,
}

export interface LabelNode extends Node {
  type: "narrativeSchemaLabel";
  data: {
    errorType?: LabelErrorType;
    html?: string;
    id?: string;
    info: string;
    labelAttributes: BlockAttributes;
    labelName: string;
    labelType: LabelType;
    pairedId?: string;
    placement?: LabelPlacement;
  };
}
