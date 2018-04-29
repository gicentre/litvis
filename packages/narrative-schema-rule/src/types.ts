export enum LabelType {
  SINGLE = "single",
  PAIRED_OPENING = "paired_opening",
  PAIRED_CLOSING = "paired_closing",
  INVALID = "invalid",
}

export enum LabelFence {
  START = "{(",
  END = ")}",
  START_CLOSING = "{|",
  END_OPENING = "|}",
}

export interface LabelKind {
  htmlTemplate: string;
}

export interface LabelDefinition {
  name: string;
  single?: LabelKind;
  paired?: LabelKind;
}
