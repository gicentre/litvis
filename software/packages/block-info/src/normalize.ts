import { normalizeBlockAttributes } from "block-attributes";
import { BlockInfo } from ".";

export default function(blockInfo: BlockInfo): BlockInfo {
  const normalizedAttributes = normalizeBlockAttributes(blockInfo.attributes);
  const normalizedLanguage = normalizeLanguage(blockInfo.language);
  if (
    normalizedAttributes !== blockInfo.attributes ||
    normalizedLanguage !== blockInfo.language
  ) {
    return {
      language: normalizedLanguage,
      attributes: normalizedAttributes,
    };
  }
  return blockInfo;
}

const normalizeLanguage = (language?: string): string => {
  if (typeof language === "string") {
    return language.trim().toLowerCase();
  }
  return "";
};
