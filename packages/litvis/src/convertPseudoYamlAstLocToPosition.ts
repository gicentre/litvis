import { loc } from "@kachkaev/pseudo-yaml-ast";
import { Position, PseudoAstNode } from "./types";

export default (pseudoAstNode: PseudoAstNode): Position => {
  const location = pseudoAstNode[loc];
  return {
    start: { line: location.start.line, column: location.start.column + 1 },
    end: { line: location.end.line, column: location.end.column + 1 },
  };
};
