import produce from "immer";
import { findIntroducedSymbols } from "literate-elm";

import type { AttributeDerivatives } from "../types";

/**
 * Looks through outputExpressionsByFormat and replaces true (i.e. auto)
 * with a lists of symbols introduced in the code block.
 * Returns a new object if any changes.
 * @param derivatives
 * @param code
 */
export const resolveExpressions = (
  derivatives: Readonly<AttributeDerivatives>,
  code: string,
) => {
  const introducedSymbols = findIntroducedSymbols(code);
  const introducedNames = introducedSymbols.map((s) => s.name);

  return produce(derivatives, (draft: AttributeDerivatives) => {
    draft.outputFormats.forEach((referenceFormat) => {
      if (
        referenceFormat !== "l" &&
        !draft.outputExpressionsByFormat[referenceFormat]
      ) {
        draft.outputExpressionsByFormat[referenceFormat] = introducedNames;
      }
    });
  });
};
