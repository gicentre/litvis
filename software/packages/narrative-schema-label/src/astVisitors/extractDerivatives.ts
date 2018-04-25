import { parse as parseBlockInfo } from "block-info";
import * as _ from "lodash";
import * as visit from "unist-util-visit";
import { VFile } from "vfile";
import { LabelType } from "../types";

export default (ast, vFile: VFile<any>) => {
  return visit(ast, "narrativeSchemaLabel", (labelNode) => {
    const parsedInfo = parseBlockInfo(labelNode.data.info);
    const labelName = parsedInfo.language;
    const labelType = labelNode.data.labelType;
    const labelAttributes = parsedInfo.attributes;

    labelNode.labelName = labelName;
    labelNode.data.labelName = labelName;
    labelNode.data.labelAttributes = labelAttributes;

    if (!labelName) {
      labelNode.data.syntaxError = true;
      vFile.message(
        `Label cannot be blank.`,
        labelNode,
        "litvis:narrative-schema-label",
      );
      return;
    }
    if (labelType === LabelType.INVALID) {
      labelNode.data.syntaxError = true;
      vFile.message(
        `Label ${labelName} is neither single nor paired, please change the endings.`,
        labelNode,
        "litvis:narrative-schema-label",
      );
      return;
    }

    if (labelType === LabelType.PAIRED_CLOSING && !_.isEmpty(labelAttributes)) {
      labelNode.data.syntaxError = true;
      vFile.message(
        `A closing paired label cannot have attributes.`,
        labelNode,
        "litvis:narrative-schema-label",
      );
      return;
    }
  });
};

// export default function() {
//   return function transformer(ast, vFile, next) {
//     visitNarrativeSchemaLabel(ast, vFile);

//     if (typeof next === "function") {
//       return next(null, ast, vFile);
//     }

//     return ast;
//   };
// }
