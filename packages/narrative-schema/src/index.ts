import * as _ from "lodash";
import {
  visitAndExtractDerivatives,
  visitAndExtractHtml,
} from "narrative-schema-label";
import { ComposedNarrativeSchema } from "./types";
export * from "./types";
export { default as loadComposedNarrativeSchema } from "./load";

export default (composedNarrativeSchema: ComposedNarrativeSchema) => () => {
  const labelDefinitionsByName = _.keyBy(
    composedNarrativeSchema.labels,
    (label) => label.name,
  );
  return function transformer(ast, vFile, next) {
    visitAndExtractDerivatives(ast, vFile);
    visitAndExtractHtml(ast, vFile, labelDefinitionsByName);

    if (typeof next === "function") {
      return next(null, ast, vFile);
    }

    return ast;
  };
};
