import { ComposedNarrativeSchema } from "narrative-schema-common";

// @ts-ignore
import { NarrativeSchemaData, VFileBase } from "narrative-schema-common";
import visitAndExtractHtml from "./visitAndExtractHtml";

export default (composedNarrativeSchema: ComposedNarrativeSchema) => () => {
  return function transformer(ast, vFile, next) {
    visitAndExtractHtml(ast, vFile, composedNarrativeSchema.labelsByName);

    if (typeof next === "function") {
      return next(null, ast, vFile);
    }
  };
};
