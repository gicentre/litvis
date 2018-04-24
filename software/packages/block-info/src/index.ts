import { BlockAttributes } from "block-attributes";

export interface BlockInfo {
  attributes: BlockAttributes;
  derivedAttributes?: BlockAttributes;
  language: string;
}

export { default as normalize } from "./normalize";
export { default as parse } from "./parse";
