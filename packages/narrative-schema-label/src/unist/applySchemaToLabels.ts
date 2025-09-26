import { ComposedNarrativeSchema } from "narrative-schema-common";
import { Node } from "unist";
import { VFile } from "vfile";

import { visitAndExtractHtml } from "./visitAndExtractHtml";

export const applySchemaToLabels =
  (composedNarrativeSchema: ComposedNarrativeSchema) => () => {
    return function transformer(
      ast: Node,
      vFile: VFile,
      next: (error: Error | null, ast: Node, vFile: VFile) => void,
    ) {
      visitAndExtractHtml(ast, vFile, composedNarrativeSchema.labelByName);

      if (typeof next === "function") {
        return next(null, ast, vFile);
      }
    };
  };
