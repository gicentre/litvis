import { EntityDefinition } from "narrative-schema-common";
import * as visit from "unist-util-visit";
import { VFile } from "vfile";
import renderHtmlTemplate from "../renderHtmlTemplate";
import { LabelErrorType, LabelType } from "../types";
import { markLabelNodeAsErroneous } from "../utils";

export default (
  ast,
  vFile: VFile<any>,
  labelDefinitionsByName: { [name: string]: EntityDefinition },
) => {
  return visit(ast, "narrativeSchemaLabel", (labelNode) => {
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
        LabelErrorType.MISSING_DEFINITION,
        `Label ${labelName} cannot be used because it does not exist in the linked narrative schemas or is not valid.`,
      );
      return;
    }

    if (labelType === LabelType.SINGLE) {
      if (!labelDefinition.data.single) {
        markLabelNodeAsErroneous(
          vFile,
          labelNode,
          LabelErrorType.KIND_MISUSE,
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
          LabelErrorType.HTML_TEMPLATE_EXCEPTION,
          `Label ${labelName} cannot be converted to html. Is htmlTemplate correct?`,
        );
      }
      return;
    }

    if (!labelDefinition.data.paired) {
      markLabelNodeAsErroneous(
        vFile,
        labelNode,
        LabelErrorType.KIND_MISUSE,
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
        LabelErrorType.HTML_TEMPLATE_EXCEPTION,
        `Label ${labelName} cannot be converted to html. Is htmlTemplate correct?`,
      );
    }
  });
};
