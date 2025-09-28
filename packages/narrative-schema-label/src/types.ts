import type { BlockAttributes } from "block-attributes";
import type { Node } from "unist";

export type LabelType =
  | "single"
  | "paired_opening"
  | "paired_closing"
  | "invalid";

export type LabelKind = "single" | "paired" | "invalid";

export type LabelPlacement = "inline" | "block" | "na";

export const LabelFence = {
  START: "{(",
  END: ")}",
  START_CLOSING: "{|",
  END_OPENING: "|}",
} as const;

export type LabelErrorType =
  | "blank"
  | "brokenNesting"
  | "brokenPair"
  | "closingWithAttributes"
  | "htmlTemplateException"
  | "invalid"
  | "kindMisuse"
  | "missingDefinition";

export interface LabelNode extends Node {
  type: "narrativeSchemaLabel";
  data: {
    errorType?: LabelErrorType;
    errorCaption?: string;
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
