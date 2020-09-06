import { ComposedNarrativeSchema } from "narrative-schema-common";

import { visitAndExtractHtml } from "./visitAndExtractHtml";

export const applySchemaToLabels = (
  composedNarrativeSchema: ComposedNarrativeSchema,
) => () => {
  return function transformer(ast, vFile, next) {
    visitAndExtractHtml(ast, vFile, composedNarrativeSchema.labelByName);

    if (typeof next === "function") {
      return next(null, ast, vFile);
    }
  };
};
