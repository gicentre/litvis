import { BlockAttributes, parseBlockAttributes } from "block-attributes";

import { BlockInfo } from "./types";

export const parseBlockInfo = (raw = ""): BlockInfo => {
  let language: string | undefined;
  let attributesAsString: string;
  let attributes: BlockAttributes;
  const trimmedParams = raw.trim();
  const [, match1, match2] =
    trimmedParams.indexOf("{") !== -1
      ? (trimmedParams.match(/^([^\s{]*)\s*\{(.*?)\}/) ?? [])
      : (trimmedParams.match(/^([^\s]+)\s+(.+?)$/) ?? []);

  if (typeof match1 === "string" && typeof match2 === "string") {
    if (match1.length) {
      language = match1;
    }
    attributesAsString = match2;
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
