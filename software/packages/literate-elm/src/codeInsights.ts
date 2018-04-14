import { ElmSymbol } from "./types";

export function findIntroducedSymbols(code: string): ElmSymbol[] {
  const result: ElmSymbol[] = [];
  code.split("\n").forEach((line) => {
    const match = line.match(
      /^([_a-zA-Z][_a-zA-Z0-9]{0,})\s*\:\s*([_a-zA-Z][_a-zA-Z0-9]{0,})\s*$/,
    );
    if (match) {
      result.push({
        name: match[1],
        type: match[2],
      });
    }
  });

  return result;
}
