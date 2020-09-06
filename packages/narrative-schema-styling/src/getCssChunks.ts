import { ComposedNarrativeSchema } from "narrative-schema-common";

import { CssChunk } from "./types";

export const getCssChunks = (
  composedNarrativeSchema: ComposedNarrativeSchema,
): CssChunk[] => {
  const result: CssChunk[] = [];
  composedNarrativeSchema.styling.forEach((stylingDefinitionWithOrigin) => {
    if (stylingDefinitionWithOrigin.data.css) {
      result.push({
        content: stylingDefinitionWithOrigin.data.css,
        comment: `${stylingDefinitionWithOrigin.origin.path}`,
      });
    }
  });
  return result;
};
