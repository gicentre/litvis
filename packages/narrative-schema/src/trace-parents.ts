// import _ from "lodash";
import type { NarrativeSchema, ParentDocument } from "narrative-schema-common";

export const traceParents = (
  parents: Array<ParentDocument | NarrativeSchema>,
): string => {
  //   if (parents && parents.length) {
  //     const parts = _.reduce(
  //       parents,
  //       (arr: string[], parent) => {
  //         if (parent.path) {
  //           arr.push("\n^ ");
  //           arr.push(parent.path);
  //         }
  //         return arr;
  //       },
  //       [],
  //     );
  //     return ` (${parts.join("")})`;
  //   }
  return "";
};
