import * as _ from "lodash";
import { NarrativeSchema } from "./types";

// @ts-ignore
import { VFileBase } from "vfile";
// @ts-ignore
import { NarrativeSchemaData } from "./types";

export default <Document extends VFileBase<any>>(
  parents: Array<Document | NarrativeSchema<Document>>,
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
