import type { BlockAttributes } from "block-attributes";

export interface BlockInfo {
  attributes: BlockAttributes;
  derivedAttributes?: BlockAttributes;
  language: string | undefined;
}
