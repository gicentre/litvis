import {
  BlockAttributes,
  parse as parseBlockAttributes,
} from "block-attributes";

import { BlockInfo } from "./types";

export const parse = (raw = ""): BlockInfo => {
  let language;
  let attributesAsString: string;
  let attributes: BlockAttributes;
  const trimmedParams = raw.trim();
  const match =
    trimmedParams.indexOf("{") !== -1
      ? trimmedParams.match(/^([^\s\{]*)\s*\{(.*?)\}/)
      : trimmedParams.match(/^([^\s]+)\s+(.+?)$/);

  if (match) {
    if (match[1].length) {
      language = match[1];
    }
    attributesAsString = match[2];
  } else {
    language = trimmedParams;
    attributesAsString = "";
  }

  if (attributesAsString) {
    try {
      attributes = parseBlockAttributes(attributesAsString);
    } catch (e) {
      attributes = {};
    }
  } else {
    attributes = {};
  }

  return { language, attributes };
};
