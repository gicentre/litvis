import type { ComposedNarrativeSchema } from "narrative-schema-common";
import type { Attacher } from "unified";

import { visitAndExtractHtml } from "./visit-and-extract-html";

export const applySchemaToLabels =
  (composedNarrativeSchema: ComposedNarrativeSchema): Attacher =>
  () => {
    return function transformer(ast, vFile, next) {
      visitAndExtractHtml(ast, vFile, composedNarrativeSchema.labelByName);

      if (typeof next === "function") {
        next(null, ast, vFile);
      }
    };
  };
