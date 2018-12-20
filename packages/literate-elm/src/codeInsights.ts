import { ElmSymbol } from "./types";

/**
 * Extracts Elm symbols introduced in the given code block.
 *
 * E.g.
 *   spec : Spec
 *     → name "spec", type "Spec"
 *   sparkline : String -> Spec
 *     → name "sparkline", type "String -> Spec" (partially applied function)
 *
 * @param code
 */
export function findIntroducedSymbols(code: string): ElmSymbol[] {
  const result: ElmSymbol[] = [];
  code.split("\n").forEach((line) => {
    const match = line.match(/^([_a-zA-Z][_a-zA-Z0-9]{0,})\s*\:\s*(.*)\s*$/);
    if (match) {
      const typeWithTrimmedComment = match[2].split("--")[0].trim();
      result.push({
        name: match[1],
        type: typeWithTrimmedComment,
      });
    }
  });

  return result;
}
