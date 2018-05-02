export enum LabelType {
  SINGLE = "single",
  PAIRED_OPENING = "paired_opening",
  PAIRED_CLOSING = "paired_closing",
  INVALID = "invalid",
}

export enum LabelKind {
  SINGLE = "single",
  INVALID = "paired",
}

export enum LabelFence {
  START = "{(",
  END = ")}",
  START_CLOSING = "{|",
  END_OPENING = "|}",
}
