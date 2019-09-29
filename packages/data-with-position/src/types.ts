export interface Position {
  start: Point;
  end: Point;
  /** >= 1 */
  indent?: number[];
}

export interface Point {
  /** >= 1 */
  line: number;
  /** >= 1 */
  column: number;
  /** >= 0 */
  offset?: number;
}

export type DataWithPosition = any;

export type DataKind =
  | "array"
  | "boolean"
  | "null"
  | "number"
  | "object"
  | "string"
  | "undefined";
