import type { EntityDefinition } from "narrative-schema-common";
import type { Node } from "unist";
import visit from "unist-util-visit";
import type { VFile } from "vfile";

import { renderHtmlTemplate } from "../renderHtmlTemplate";
import type { LabelNode } from "../types";
import { markLabelNodeAsErroneous } from "../utils";

export const visitAndExtractHtml = (
  ast: Node,
  vFile: VFile,
  labelDefinitionsByName: { [name: string]: EntityDefinition },
) => {
  return visit(ast, "narrativeSchemaLabel", (labelNode: LabelNode) => {
    if (labelNode.data.errorType) {
      return;
    }

    const labelType = labelNode.data.labelType;
    const labelName = labelNode.data.labelName;
    const labelAttributes = labelNode.data.labelAttributes;

    const labelDefinition = labelDefinitionsByName[labelName];
    if (!labelDefinition) {
      markLabelNodeAsErroneous(
        vFile,
        labelNode,
        "missingDefinition",
        `Label ${labelName} cannot be used because it does not exist in the linked narrative schemas or is not valid.`,
      );

      return;
    }

    if (labelType === "single") {
      if (!labelDefinition.data.single) {
        markLabelNodeAsErroneous(
          vFile,
          labelNode,
          "kindMisuse",
          `Label ${labelName} cannot be used as single (no-paired), according to the linked narrative schemas.`,
        );

        return;
      }
      try {
        const html = renderHtmlTemplate(
          labelDefinition.data.single.htmlTemplate,
          labelName,
          labelType,
          labelAttributes,
        );
        labelNode.data.html = html;
      } catch (e) {
        markLabelNodeAsErroneous(
          vFile,
          labelNode,
          "htmlTemplateException",
          `Label ${labelName} cannot be converted to html. Is htmlTemplate correct?`,
        );
      }

      return;
    }

    if (!labelDefinition.data.paired) {
      markLabelNodeAsErroneous(
        vFile,
        labelNode,
        "kindMisuse",
        `Label ${labelName} cannot be used as paired, according to the linked narrative schemas.`,
      );

      return;
    }

    try {
      const html = renderHtmlTemplate(
        labelDefinition.data.paired.htmlTemplate,
        labelName,
        labelType,
        labelAttributes,
      );
      labelNode.data.html = html;
    } catch (e) {
      markLabelNodeAsErroneous(
        vFile,
        labelNode,
        "htmlTemplateException",
        `Label ${labelName} cannot be converted to html. Is htmlTemplate correct?`,
      );
    }
  });
};
